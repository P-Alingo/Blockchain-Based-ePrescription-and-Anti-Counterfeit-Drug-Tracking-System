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

// Fetch users from the database
async function getUsersFromDB() {
  try {
    const { rows } = await client.query('SELECT * FROM users ORDER BY createdat DESC');
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

// Get user status from blockchain
async function getUserStatus(walletAddress) {
  try {
    const status = await userManagement.getUserStatus(walletAddress);
    return status; // returns "pending", "active", or "suspended"
  } catch (err) {
    return "pending"; // default if not on-chain
  }
}

// Get user role from blockchain
async function getUserRole(walletAddress) {
  try {
    const role = await userManagement.getUserRole(walletAddress);
    return role;
  } catch (err) {
    return "Unknown";
  }
}

async function main() {
  try {
    console.log("Fetching blockchain state...\n");

    const users = await getUsersFromDB();
    console.log(`Total users in DB: ${users.length}`);
    console.log('-----------------------------');

    for (const user of users) {
      const walletAddress = user.wallet_address;

      if (!walletAddress) {
        console.log(`User ${user.full_name} has no wallet address`);
        console.log('-----------------------------');
        continue;
      }

      // Fetch latest on-chain role and status
      const [onChainRole, status] = await Promise.all([
        getUserRole(walletAddress),
        getUserStatus(walletAddress)
      ]);

      console.log(`User: ${user.full_name}`);
      console.log(`  Wallet: ${walletAddress}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Role (on-chain): ${onChainRole}`);
      console.log(`  Status: ${status}`);
      console.log('-----------------------------');
    }

    console.log("Done reading blockchain state!");
  } catch (err) {
    console.error("Error reading blockchain:", err);
  } finally {
    await client.end();
  }
}

main();
