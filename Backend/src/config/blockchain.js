// src/config/blockchain.js
import dotenv from "dotenv";
import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { logger } from "./logger.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---- Path to UserManagement contract artifact ----
const artifactPath = path.resolve(
  __dirname,
  "../../../Smart Contracts/artifacts/contracts/UserManagement.sol/UserManagement.json"
);

// Load ABI
let userManagementABI;
try {
  if (!fs.existsSync(artifactPath)) {
    throw new Error(`Contract artifact not found at: ${artifactPath}`);
  }
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  userManagementABI = artifact.abi;
  console.log("✅ UserManagement ABI loaded");
} catch (err) {
  console.error("❌ Failed to load UserManagement ABI:", err.message);
  process.exit(1);
}

// ---- Provider & Wallet ----
let provider, wallet;
try {
  provider = new ethers.providers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL);
  wallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, provider);
  console.log("✅ Provider & wallet initialized");
} catch (err) {
  console.error("❌ Failed to initialize provider/wallet:", err.message);
  process.exit(1);
}

// ---- UserManagement Contract ----
let userManagementContract;
try {
  if (!process.env.USER_MANAGEMENT_ADDRESS) {
    throw new Error("USER_MANAGEMENT_ADDRESS not set in .env");
  }
  userManagementContract = new ethers.Contract(
    process.env.USER_MANAGEMENT_ADDRESS,
    userManagementABI,
    wallet
  );
  console.log("✅ UserManagement contract initialized at", process.env.USER_MANAGEMENT_ADDRESS);
  logger.info("UserManagement contract connected to blockchain");
} catch (err) {
  console.error("❌ Failed to initialize UserManagement contract:", err.message);
  process.exit(1);
}

// ---- Optional: verify connection ----
async function verifyConnection() {
  try {
    const network = await provider.getNetwork();
    const blockNumber = await provider.getBlockNumber();
    console.log(`✓ Connected to blockchain: ${network.name} (Chain ID: ${network.chainId})`);
    console.log(`✓ Current block: ${blockNumber}`);
    return true;
  } catch (err) {
    console.error("❌ Blockchain connection verification failed:", err.message);
    return false;
  }
}

// Verify connection immediately
verifyConnection();

// ---- Export ----
export {
  provider,
  wallet,
  userManagementContract,
  verifyConnection
};
