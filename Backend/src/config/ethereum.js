import { ethers } from "ethers";
import dotenv from "dotenv";

dotenv.config();

const INFURA_API_KEY = process.env.INFURA_API_KEY || "";
const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY || "";
const ETH_PROVIDER_URL = process.env.ETH_PROVIDER_URL || "";

const provider = new ethers.JsonRpcProvider(
  ETH_PROVIDER_URL ||
    (INFURA_API_KEY
      ? `https://mainnet.infura.io/v3/${INFURA_API_KEY}`
      : ALCHEMY_API_KEY
      ? `https://eth-mainnet.alchemyapi.io/v2/${ALCHEMY_API_KEY}`
      : "https://mainnet.infura.io/v3/your_default_key")
);

// Signers: For write transactions; using private key from env or from JSON-RPC provider's wallet
const signer = (() => {
  const privateKey = process.env.ETH_PRIVATE_KEY;
  if (privateKey) {
    return new ethers.Wallet(privateKey, provider);
  }
  // If no private key, fallback to provider's default signer (may be restricted)
  return provider.getSigner();
})();

// Load ABIs (mocked here as empty arrays; replace with actual ABI JSON arrays)
const prescriptionABI = JSON.parse(process.env.ABI_PRESCRIPTION || "[]");
const drugSupplyChainABI = JSON.parse(process.env.ABI_DRUG_SUPPLY_CHAIN || "[]");
const regulatorOversightABI = JSON.parse(process.env.ABI_REGULATOR_OVERSIGHT || "[]");
const userManagementABI = JSON.parse(process.env.ABI_USER_MANAGEMENT || "[]");

// Contract addresses from env vars
const prescriptionAddress = process.env.CONTRACT_ADDRESS_PRESCRIPTION || "";
const drugSupplyChainAddress = process.env.CONTRACT_ADDRESS_DRUG_SUPPLY_CHAIN || "";
const regulatorOversightAddress = process.env.CONTRACT_ADDRESS_REGULATOR_OVERSIGHT || "";
const userManagementAddress = process.env.CONTRACT_ADDRESS_USER_MANAGEMENT || "";

const prescriptionContract = new ethers.Contract(prescriptionAddress, prescriptionABI, signer);
const drugSupplyChainContract = new ethers.Contract(drugSupplyChainAddress, drugSupplyChainABI, signer);
const regulatorOversightContract = new ethers.Contract(regulatorOversightAddress, regulatorOversightABI, signer);
const userManagementContract = new ethers.Contract(userManagementAddress, userManagementABI, signer);

export {
  provider,
  signer,
  prescriptionContract,
  drugSupplyChainContract,
  regulatorOversightContract,
  userManagementContract,
};
