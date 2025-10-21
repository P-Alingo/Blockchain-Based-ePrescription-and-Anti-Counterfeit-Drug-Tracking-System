import dotenv from 'dotenv';
import { ethers } from 'ethers';
import pkg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load contract artifact
const userManagementArtifact = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, '../../Smart Contracts/artifacts/contracts/UserManagement.sol/UserManagement.json'),
    'utf8'
  )
);

// PostgreSQL setup
const { Client } = pkg;
const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

// Check if is_deleted column exists
async function checkIsDeletedColumnExists() {
  try {
    const { rows } = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='users' AND column_name='is_deleted'
    `);
    return rows.length > 0;
  } catch (error) {
    console.error('Error checking is_deleted column:', error);
    return false;
  }
}

// Fetch all users (active and deleted)
async function getUsersFromDB() {
  try {
    const hasIsDeletedColumn = await checkIsDeletedColumnExists();
    
    let query = 'SELECT * FROM users ORDER BY createdat DESC';
    if (hasIsDeletedColumn) {
      query = 'SELECT * FROM users ORDER BY is_deleted, createdat DESC';
    }
    
    const { rows } = await client.query(query);
    return rows;
  } catch (err) {
    console.error('Failed to fetch users from DB:', err);
    return [];
  }
}

// Blockchain setup
const provider = new ethers.providers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL);
const wallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, provider);

// Contract instance
const userManagement = new ethers.Contract(
  process.env.USER_MANAGEMENT_ADDRESS,
  userManagementArtifact.abi,
  wallet
);

// Check if user exists on blockchain
async function checkUserExistsOnChain(walletAddress) {
  try {
    const role = await userManagement.getUserRole(walletAddress);
    return { exists: true, role };
  } catch (error) {
    if (error.reason === 'User does not exist') {
      return { exists: false, role: null };
    }
    console.error(`Error checking user existence for ${walletAddress}:`, error.message);
    return { exists: false, role: null, error: error.message };
  }
}

// Get user status from blockchain
async function getUserStatus(walletAddress) {
  try {
    const status = await userManagement.getUserStatus(walletAddress);
    return status; // returns "pending", "active", or "suspended"
  } catch (err) {
    if (err.reason === 'User does not exist') {
      return "not_registered";
    }
    return "error"; // error case
  }
}

// Get user role from blockchain
async function getUserRole(walletAddress) {
  try {
    const role = await userManagement.getUserRole(walletAddress);
    return role;
  } catch (err) {
    if (err.reason === 'User does not exist') {
      return "not_registered";
    }
    return "error";
  }
}

// Get comprehensive user info from blockchain
async function getUserBlockchainInfo(walletAddress) {
  try {
    const [role, status, existsCheck] = await Promise.all([
      getUserRole(walletAddress),
      getUserStatus(walletAddress),
      checkUserExistsOnChain(walletAddress)
    ]);

    return {
      role,
      status,
      exists: existsCheck.exists,
      error: null
    };
  } catch (err) {
    return {
      role: "error",
      status: "error",
      exists: false,
      error: err.message
    };
  }
}

async function main() {
  try {
    console.log("🔗 Fetching blockchain state...\n");

    const hasIsDeletedColumn = await checkIsDeletedColumnExists();
    const allUsers = await getUsersFromDB();
    
    const activeUsers = hasIsDeletedColumn 
      ? allUsers.filter(user => !user.is_deleted)
      : allUsers;
    
    const deletedUsers = hasIsDeletedColumn
      ? allUsers.filter(user => user.is_deleted)
      : [];

    console.log(`📊 Active users in DB: ${activeUsers.length}`);
    console.log(`🗑️  Deleted users in DB: ${deletedUsers.length}`);
    console.log(`🔧 Soft Delete Enabled: ${hasIsDeletedColumn ? '✅' : '❌'}`);
    console.log('=' .repeat(50));

    // Process active users
    if (activeUsers.length > 0) {
      console.log('\n🎯 ACTIVE USERS:');
      console.log('-'.repeat(50));

      for (const user of activeUsers) {
        const walletAddress = user.wallet_address;

        if (!walletAddress) {
          console.log(`❌ User: ${user.full_name}`);
          console.log(`   Email: ${user.email}`);
          console.log(`   Status: NO WALLET ADDRESS`);
          console.log('-'.repeat(30));
          continue;
        }

        const blockchainInfo = await getUserBlockchainInfo(walletAddress);
        
        console.log(`👤 User: ${user.full_name}`);
        console.log(`   Wallet: ${walletAddress}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   DB Role: ${user.role}`);
        console.log(`   DB Status: ${user.status}`);
        console.log(`   On-chain Role: ${blockchainInfo.role}`);
        console.log(`   On-chain Status: ${blockchainInfo.status}`);
        console.log(`   On-chain Exists: ${blockchainInfo.exists ? '✅' : '❌'}`);
        
        // Check sync status
        const isSynced = blockchainInfo.exists && 
                         blockchainInfo.status === user.status.toLowerCase() && 
                         blockchainInfo.role === user.role.toLowerCase();
        
        console.log(`   Sync Status: ${isSynced ? '✅ SYNCED' : '⚠️ NOT SYNCED'}`);
        
        if (blockchainInfo.error) {
          console.log(`   Error: ${blockchainInfo.error}`);
        }
        console.log('-'.repeat(30));
      }
    }

    // Process deleted users only if soft delete is enabled
    if (hasIsDeletedColumn && deletedUsers.length > 0) {
      console.log('\n🗑️  DELETED USERS (Soft Delete):');
      console.log('-'.repeat(50));

      for (const deletedUser of deletedUsers) {
        const walletAddress = deletedUser.wallet_address;

        if (!walletAddress) {
          console.log(`📝 Deleted User: ${deletedUser.full_name}`);
          console.log(`   Email: [DELETED]`);
          console.log(`   DB Status: ${deletedUser.status}`);
          console.log(`   Status: NO WALLET ADDRESS`);
          console.log('-'.repeat(30));
          continue;
        }

        const blockchainInfo = await getUserBlockchainInfo(walletAddress);
        
        console.log(`📝 Deleted User: ${deletedUser.full_name}`);
        console.log(`   Wallet: ${walletAddress}`);
        console.log(`   Email: [DELETED]`);
        console.log(`   DB Status: ${deletedUser.status}`);
        console.log(`   On-chain Role: ${blockchainInfo.role}`);
        console.log(`   On-chain Status: ${blockchainInfo.status}`);
        console.log(`   On-chain Exists: ${blockchainInfo.exists ? '✅' : '❌'}`);
        
        // Check if properly preserved on blockchain
        const properlyPreserved = blockchainInfo.exists && 
                                 blockchainInfo.status === 'suspended';
        
        console.log(`   Preservation Status: ${properlyPreserved ? '✅ PROPERLY PRESERVED' : '⚠️ NOT PRESERVED'}`);
        
        if (blockchainInfo.error) {
          console.log(`   Error: ${blockchainInfo.error}`);
        }
        console.log('-'.repeat(30));
      }
    } else if (hasIsDeletedColumn) {
      console.log('\n🗑️  DELETED USERS: No deleted users found.');
    }

    // Summary
    console.log('\n📈 SUMMARY:');
    console.log('-'.repeat(30));
    
    const activeWithWallets = activeUsers.filter(u => u.wallet_address);
    const deletedWithWallets = deletedUsers.filter(u => u.wallet_address);
    
    console.log(`Active users with wallets: ${activeWithWallets.length}`);
    console.log(`Deleted users with wallets: ${deletedWithWallets.length}`);
    console.log(`Total blockchain records: ${activeWithWallets.length + deletedWithWallets.length}`);
    console.log(`Soft Delete Feature: ${hasIsDeletedColumn ? '✅ ENABLED' : '❌ DISABLED'}`);

    // Check contract health
    try {
      const roleCounter = await userManagement.roleCounter();
      console.log(`Contract role counter: ${roleCounter.toString()}`);
      console.log('✅ Contract connection healthy');
    } catch (error) {
      console.log('❌ Contract connection issues:', error.message);
    }

    // Show setup instructions if needed
    if (!hasIsDeletedColumn) {
      console.log('\n💡 TO ENABLE SOFT DELETE:');
      console.log('Run this SQL in your database:');
      console.log(`
        ALTER TABLE users ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE;
        UPDATE users SET is_deleted = FALSE WHERE is_deleted IS NULL;
        CREATE INDEX IF NOT EXISTS idx_users_is_deleted ON users(is_deleted);
      `);
    }

    console.log("\n✅ Done reading blockchain state!");

  } catch (err) {
    console.error("❌ Error reading blockchain:", err);
  } finally {
    await client.end();
    process.exit(0);
  }
}

main();