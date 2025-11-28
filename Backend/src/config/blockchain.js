// src/config/blockchain.js

import dotenv from "dotenv";
import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const contractsConfig = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../contracts.json"), "utf8"));
const provider = new ethers.providers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL);
let wallet = null;
console.log('Loaded ADMIN_PRIVATE_KEY:', process.env.ADMIN_PRIVATE_KEY);
if (!process.env.ADMIN_PRIVATE_KEY) {
  console.error("❌ ADMIN_PRIVATE_KEY is missing from environment variables. Blockchain wallet will not be initialized.");
} else {
  wallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, provider);
}

function loadABI(abiPath) {
  return JSON.parse(fs.readFileSync(abiPath, "utf8"));
}

const userManagementContract = new ethers.Contract(
  contractsConfig.USER_MANAGEMENT_ADDRESS,
  loadABI(contractsConfig.ABI_PATHS.BACKEND.USER_MANAGEMENT),
  wallet
);

const regulatorOversightContract = new ethers.Contract(
  contractsConfig.REGULATOR_OVERSIGHT_ADDRESS,
  loadABI(contractsConfig.ABI_PATHS.BACKEND.REGULATOR_OVERSIGHT),
  wallet
);

const drugSupplyChainContract = new ethers.Contract(
  contractsConfig.DRUG_SUPPLY_CHAIN_ADDRESS,
  loadABI(contractsConfig.ABI_PATHS.BACKEND.DRUG_SUPPLY_CHAIN),
  wallet
);

const prescriptionManagementContract = new ethers.Contract(
  contractsConfig.PRESCRIPTION_MANAGEMENT_ADDRESS,
  loadABI(contractsConfig.ABI_PATHS.BACKEND.PRESCRIPTION_MANAGEMENT),
  wallet
);

// Optional: verify connection
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
verifyConnection();

export {
  provider,
  wallet,
  userManagementContract,
  regulatorOversightContract,
  drugSupplyChainContract,
  prescriptionManagementContract,
  verifyConnection
};
