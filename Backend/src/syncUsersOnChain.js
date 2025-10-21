import dotenv from 'dotenv';
import { ethers } from 'ethers';
import pkg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();
const { Client } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---- Load contract artifacts ----
const userManagementArtifact = JSON.parse(
  fs.readFileSync(
    path.join(
      __dirname,
      '../../Smart Contracts/artifacts/contracts/UserManagement.sol/UserManagement.json'
    ),
    'utf8'
  )
);

// ---- Database Client ----
const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

// ---- Logging ----
const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
const logFile = path.join(logDir, `syncUsers_${new Date().toISOString().replace(/[:.]/g,'-')}.log`);

function log(message) {
  console.log(message);
  fs.appendFileSync(logFile, message + '\n');
}

// ---- Main Function ----
async function main() {
  await client.connect();
  log('✅ Connected to PostgreSQL');

  // Setup blockchain connection
  const provider = new ethers.providers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL);
  const wallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, provider);

  const userManagement = new ethers.Contract(
    process.env.USER_MANAGEMENT_ADDRESS,
    userManagementArtifact.abi,
    wallet
  );

  // Fetch verified users from DB
  const res = await client.query(
    'SELECT wallet_address, role FROM users WHERE isverified = true'
  );
  log(`📋 Found ${res.rows.length} verified users`);

  const alreadyOnChain = [];
  const toSync = [];

  // Detect unsynced users
  for (const row of res.rows) {
    const walletAddress = row.wallet_address;
    try {
      const role = await userManagement.getUserRole(walletAddress);
      alreadyOnChain.push({ wallet: walletAddress, role });
    } catch {
      toSync.push(row);
    }
  }

  log(`ℹ️ ${alreadyOnChain.length} users already on-chain:`);
  alreadyOnChain.forEach(u => log(` - ${u.wallet} : ${u.role}`));

  if (toSync.length === 0) {
    log('🎉 All users already synced. No new registrations needed.');
  } else {
    log(`⚡ ${toSync.length} users to sync:`);

    // Loop over unsynced users and register
    for (const row of toSync) {
      const walletAddress = row.wallet_address;
      const roleName = row.role.toLowerCase();

      // Check if role exists on-chain
      let roleId = 0;
      const totalRoles = await userManagement.roleCounter();

      for (let i = 1; i <= totalRoles; i++) {
        const name = await userManagement.getRoleName(i);
        if (name.toLowerCase() === roleName) {
          roleId = i;
          break;
        }
      }

      // Create the role if not found
      if (roleId === 0) {
        const tx = await userManagement.createRole(roleName);
        await tx.wait();
        roleId = await userManagement.roleCounter();
        log(`🆕 Role '${roleName}' created with ID ${roleId}`);
      }

      // Register user
      const tx = await userManagement.registerUser(walletAddress, roleId);
      await tx.wait();
      log(`✅ User ${walletAddress} registered as '${roleName}'`);
    }
  }

  await client.end();
  log('🎉 Sync complete');
  log(`🔗 Log saved at: ${logFile}`);
}

// ---- Run ----
main().catch((err) => {
  console.error('❌ Error syncing users:', err);
  fs.appendFileSync(logFile, `❌ Error: ${err}\n`);
  client.end();
});
