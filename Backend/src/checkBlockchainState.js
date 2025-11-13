//src/checkBlockchainState.js
import dotenv from 'dotenv';
import pkg from 'pg';
import * as blockchainService from './services/blockchainService.js';

dotenv.config();

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

// Get comprehensive user info from blockchain using the service
async function getUserBlockchainInfo(walletAddress) {
  try {
    const blockchainData = await blockchainService.getUserOnChain(walletAddress);
    
    return {
      role: blockchainData.exists ? blockchainData.role : 'not_registered',
      status: blockchainData.exists ? blockchainData.status : 'not_registered',
      exists: blockchainData.exists,
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

// Check blockchain health using the service
async function checkBlockchainHealth() {
  try {
    const health = await blockchainService.getBlockchainHealth();
    return health;
  } catch (error) {
    return {
      connected: false,
      error: error.message
    };
  }
}

async function main() {
  try {
    console.log("🔗 Fetching blockchain state using Blockchain Service...\n");

    // Check blockchain health first
    const blockchainHealth = await checkBlockchainHealth();
    console.log(`📡 Blockchain Connection: ${blockchainHealth.connected ? '✅ CONNECTED' : '❌ DISCONNECTED'}`);
    
    if (blockchainHealth.connected) {
      console.log(`   Network: ${blockchainHealth.network}`);
      console.log(`   Chain ID: ${blockchainHealth.chainId}`);
      console.log(`   Admin Address: ${blockchainHealth.adminAddress}`);
      console.log(`   Admin Balance: ${blockchainHealth.adminBalance} ETH`);
      console.log(`   Contract: ${blockchainHealth.contractAddress}`);
    } else {
      console.log(`   Error: ${blockchainHealth.error}`);
    }

    const hasIsDeletedColumn = await checkIsDeletedColumnExists();
    const allUsers = await getUsersFromDB();
    
    const activeUsers = hasIsDeletedColumn 
      ? allUsers.filter(user => !user.is_deleted)
      : allUsers;
    
    const deletedUsers = hasIsDeletedColumn
      ? allUsers.filter(user => user.is_deleted)
      : [];

    console.log(`\n📊 Database Summary:`);
    console.log(`   Active users in DB: ${activeUsers.length}`);
    console.log(`   Deleted users in DB: ${deletedUsers.length}`);
    console.log(`   Soft Delete Enabled: ${hasIsDeletedColumn ? '✅' : '❌'}`);
    console.log('=' .repeat(60));

    // Process active users
    if (activeUsers.length > 0) {
      console.log('\n🎯 ACTIVE USERS:');
      console.log('-'.repeat(60));

      for (const user of activeUsers) {
        const walletAddress = user.wallet_address;

        if (!walletAddress) {
          console.log(`❌ User: ${user.full_name}`);
          console.log(`   Email: ${user.email}`);
          console.log(`   Status: NO WALLET ADDRESS`);
          console.log('-'.repeat(40));
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
        
        // Show actionable items for unsynced users
        if (!isSynced && blockchainInfo.exists) {
          console.log(`   💡 Action: Run sync for user ID ${user.id}`);
        } else if (!blockchainInfo.exists && user.status === 'active') {
          console.log(`   💡 Action: User needs blockchain registration`);
        }
        
        console.log('-'.repeat(40));
      }
    }

    // Process deleted users only if soft delete is enabled
    if (hasIsDeletedColumn && deletedUsers.length > 0) {
      console.log('\n🗑️  DELETED USERS (Soft Delete):');
      console.log('-'.repeat(60));

      for (const deletedUser of deletedUsers) {
        const walletAddress = deletedUser.wallet_address;

        if (!walletAddress) {
          console.log(`📝 Deleted User: ${deletedUser.full_name}`);
          console.log(`   Email: [DELETED]`);
          console.log(`   DB Status: ${deletedUser.status}`);
          console.log(`   Status: NO WALLET ADDRESS`);
          console.log('-'.repeat(40));
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
        
        // Show actionable items
        if (!properlyPreserved && blockchainInfo.exists) {
          console.log(`   💡 Action: Should be suspended on blockchain`);
        }
        
        console.log('-'.repeat(40));
      }
    } else if (hasIsDeletedColumn) {
      console.log('\n🗑️  DELETED USERS: No deleted users found.');
    }

    // Summary with actionable insights
    console.log('\n📈 COMPREHENSIVE SUMMARY:');
    console.log('-'.repeat(40));
    
    const activeWithWallets = activeUsers.filter(u => u.wallet_address);
    const deletedWithWallets = deletedUsers.filter(u => u.wallet_address);
    
    // Count sync status
    let syncedCount = 0;
    let notSyncedCount = 0;
    let notRegisteredCount = 0;
    
    for (const user of activeWithWallets) {
      const blockchainInfo = await getUserBlockchainInfo(user.wallet_address);
      const isSynced = blockchainInfo.exists && 
                      blockchainInfo.status === user.status.toLowerCase() && 
                      blockchainInfo.role === user.role.toLowerCase();
      
      if (isSynced) syncedCount++;
      else if (!blockchainInfo.exists) notRegisteredCount++;
      else notSyncedCount++;
    }
    
    console.log(`Active users with wallets: ${activeWithWallets.length}`);
    console.log(`  ✅ Synced: ${syncedCount}`);
    console.log(`  ⚠️  Not Synced: ${notSyncedCount}`);
    console.log(`  ❌ Not Registered: ${notRegisteredCount}`);
    console.log(`Deleted users with wallets: ${deletedWithWallets.length}`);
    console.log(`Soft Delete Feature: ${hasIsDeletedColumn ? '✅ ENABLED' : '❌ DISABLED'}`);
    
    // Contract info
    if (blockchainHealth.connected) {
      try {
        const contract = blockchainService.getContract();
        const roleCounter = await contract.roleCounter();
        console.log(`Contract role counter: ${roleCounter.toString()}`);
        
        // List existing roles
        console.log(`\n🏷️  EXISTING ROLES ON CHAIN:`);
        for (let i = 1; i <= roleCounter; i++) {
          try {
            const roleName = await contract.getRoleName(i);
            console.log(`   ${i}. ${roleName}`);
          } catch (error) {
            console.log(`   ${i}. [Error fetching role]`);
          }
        }
      } catch (error) {
        console.log('❌ Error fetching contract details:', error.message);
      }
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

    // Recommendations
    console.log('\n🎯 RECOMMENDATIONS:');
    if (notRegisteredCount > 0) {
      console.log(`   • Register ${notRegisteredCount} users on blockchain`);
    }
    if (notSyncedCount > 0) {
      console.log(`   • Sync ${notSyncedCount} users to match blockchain state`);
    }
    if (!hasIsDeletedColumn) {
      console.log(`   • Enable soft delete feature for better user management`);
    }

    console.log("\n✅ Blockchain state check completed using Blockchain Service!");

  } catch (err) {
    console.error("❌ Error reading blockchain state:", err);
  } finally {
    await client.end();
    process.exit(0);
  }
}

// Export for potential use in other scripts
export const checkBlockchainState = main;

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}