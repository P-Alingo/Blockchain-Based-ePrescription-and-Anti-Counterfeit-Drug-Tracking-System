// Bulk register all users from PostgreSQL to UserManagement contract
// Usage: node registerAllUsers.js

// No dotenv: hardcoded config below
const { ethers } = require("ethers");
const { Client } = require("pg");
// Remove pg-connection-string: not needed for hardcoded config
const fs = require("fs");
const path = require("path");

// --- CONFIG ---
const dbConfig = {
  user: 'postgres',
  host: 'localhost',
  database: 'eprescribe_kenya',
  password: 'Mkenya04!',
  port: 5432,
};
const userManagementAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
const adminPrivateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
const providerUrl = 'http://127.0.0.1:8545';

// --- MAIN SCRIPT ---
async function main() {
  // Connect to DB
  const client = new Client(dbConfig);
  await client.connect();

  // Fetch all users
  const res = await client.query('SELECT wallet_address, role, email, full_name FROM users WHERE wallet_address IS NOT NULL');
  const users = res.rows;
  console.log(`Found ${users.length} users.`);

  // Set up provider and admin signer
  const provider = new ethers.JsonRpcProvider(providerUrl);
  const adminWallet = new ethers.Wallet(adminPrivateKey, provider);
  // Load ABI
  const userManagementAbi = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../artifacts/contracts/UserManagement.sol/UserManagement.json'), 'utf8')).abi;
  const userManagement = new ethers.Contract(userManagementAddress, userManagementAbi, adminWallet);

  // Role name to roleId mapping (update as needed to match your contract)
  const roleIds = {
    doctor: 1,
    patient: 2,
    pharmacist: 3,
    admin: 4,
    regulator: 5,
    manufacturer: 6,
    distributor: 7,
  };

  // Register each user
  for (const user of users) {
    const roleId = roleIds[user.role.toLowerCase()];
    if (!roleId) {
      console.log(`Skipping ${user.email} (${user.role}): unknown role.`);
      continue;
    }
    try {
      const tx = await userManagement.registerUser(user.wallet_address, roleId);
      await tx.wait();
      console.log(`Registered ${user.email} (${user.role}) - ${user.wallet_address}`);
    } catch (err) {
      console.error(`Failed for ${user.email} (${user.role}):`, err.message);
    }
  }

  await client.end();
  console.log('Bulk registration complete.');
}

main().catch((err) => {
  console.error('Script error:', err);
  process.exit(1);
});
