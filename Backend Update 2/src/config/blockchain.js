// src/config/blockchain.js
import pkg from "ethers";
const { ethers } = pkg;
import { logger } from "./logger.js";
import fetch from "node-fetch"; // Make sure you installed node-fetch

let provider;
let prescriptionContract;
let drugSupplyChainContract;
let userManagementContract;
let regulatorOversightContract;
let isConnected = false;

// Initialize real blockchain connection
async function initializeBlockchain() {
  try {
    const rpcUrl = process.env.BLOCKCHAIN_RPC_URL || "http://localhost:8545";
    const prescriptionAddress = process.env.PRESCRIPTION_CONTRACT_ADDRESS;
    const drugSupplyChainAddress = process.env.DRUG_SUPPLY_CHAIN_ADDRESS;
    const userManagementAddress = process.env.USER_MANAGEMENT_ADDRESS;
    const regulatorOversightAddress = process.env.REGULATOR_OVERSIGHT_ADDRESS;

    if (!prescriptionAddress || !drugSupplyChainAddress || !userManagementAddress || !regulatorOversightAddress) {
      throw new Error("Contract addresses not found in environment variables");
    }

    // Initialize provider
    provider = new ethers.JsonRpcProvider(rpcUrl);

    // Check connection
    const network = await provider.getNetwork();
    const blockNumber = await provider.getBlockNumber();

    console.log(`✓ Connected to blockchain: ${network.name} (Chain ID: ${network.chainId})`);
    console.log(`✓ Current block: ${blockNumber}`);

    // Load contract ABIs
    const prescriptionABI = await loadContractABI("Prescription");
    const drugSupplyChainABI = await loadContractABI("DrugSupplyChain");
    const userManagementABI = await loadContractABI("UserManagement");
    const regulatorOversightABI = await loadContractABI("RegulatorOversight");

    // Initialize contracts
    prescriptionContract = new ethers.Contract(prescriptionAddress, prescriptionABI, provider);
    drugSupplyChainContract = new ethers.Contract(drugSupplyChainAddress, drugSupplyChainABI, provider);
    userManagementContract = new ethers.Contract(userManagementAddress, userManagementABI, provider);
    regulatorOversightContract = new ethers.Contract(regulatorOversightAddress, regulatorOversightABI, provider);

    console.log(`✓ Prescription contract: ${prescriptionAddress}`);
    console.log(`✓ Drug Supply Chain contract: ${drugSupplyChainAddress}`);
    console.log(`✓ User Management contract: ${userManagementAddress}`);
    console.log(`✓ Regulator Oversight contract: ${regulatorOversightAddress}`);

    isConnected = true;
    logger.info("Real blockchain connection established with all contracts");

    return {
      provider,
      prescriptionContract,
      drugSupplyChainContract,
      userManagementContract,
      regulatorOversightContract,
    };
  } catch (error) {
    console.error("❌ Failed to connect to blockchain:", error.message);
    logger.error("Blockchain connection failed, falling back to mock mode");
    return initializeMockBlockchain();
  }
}

// Load contract ABI from file
async function loadContractABI(contractName) {
  try {
    const response = await fetch(new URL("./contractABI.json", import.meta.url));
    const abis = await response.json();
    return abis[contractName] || abis.default;
  } catch (error) {
    console.warn(`⚠️ Could not load ${contractName} ABI file, using minimal ABI`);
    return getMinimalABI(contractName);
  }
}

// Minimal ABI fallback
function getMinimalABI(contractName) {
  const abis = {
    Prescription: [
      "event PrescriptionCreated(uint256 indexed prescriptionId, address indexed doctor, address indexed patient, string details)",
      "event PrescriptionFilled(uint256 indexed prescriptionId, address indexed pharmacist)",
      "event PrescriptionRevoked(uint256 indexed prescriptionId, address indexed revoker, string reason)",
      "function createPrescription(uint256 _prescriptionId, address _patient, string _details) external",
      "function fillPrescription(uint256 _prescriptionId) external",
      "function revokePrescription(uint256 _prescriptionId, string _reason) external",
    ],
    DrugSupplyChain: [
      "event DrugBatchCreated(uint256 indexed batchId, address indexed manufacturer, string batchData)",
      "event SupplyChainTransfer(uint256 indexed batchId, address indexed from, address indexed to, string action)",
      "event BatchQualityChecked(uint256 indexed batchId, address indexed regulator, bool passed)",
      "function createBatch(uint256 _batchId, string _batchData) external",
      "function transferBatch(uint256 _batchId, address _to, string _action) external",
      "function checkBatchQuality(uint256 _batchId, bool _passed) external",
    ],
    UserManagement: [
      "event UserRegistered(address indexed user, string role, string details)",
      "event UserStatusChanged(address indexed user, string newStatus)",
      "event RoleAssigned(address indexed user, string role)",
      "function registerUser(address _user, string _role, string _details) external",
      "function changeUserStatus(address _user, string _status) external",
      "function assignRole(address _user, string _role) external",
    ],
    RegulatorOversight: [
      "event AuditPerformed(address indexed auditor, string auditType, bool result)",
      "event ComplianceStatusChanged(address indexed entity, string complianceStatus)",
      "event ViolationReported(address indexed reporter, address indexed violator, string details)",
      "function performAudit(string _auditType, bool _result) external",
      "function updateComplianceStatus(address _entity, string _status) external",
      "function reportViolation(address _violator, string _details) external",
    ],
  };
  return abis[contractName] || ["event GenericEvent(uint256 indexed id, address indexed user, string action)"];
}

// Mock blockchain
function initializeMockBlockchain() {
  console.log("⚠️ Initializing mock blockchain (development mode)");

  class MockProvider {
    async getNetwork() {
      return { name: "hardhat", chainId: 31337 };
    }
    async getBlockNumber() {
      return Math.floor(Math.random() * 1000);
    }
  }

  class MockContract {
    constructor(name) {
      this.contractName = name;
      this.listeners = new Map();
      this._isMock = true;
    }
    on(eventName, cb) {
      console.log(`[MOCK ${this.contractName}] Listening for event: ${eventName}`);
      if (!this.listeners.has(eventName)) this.listeners.set(eventName, []);
      this.listeners.set(eventName, [...this.listeners.get(eventName), cb]);
      // simulateEvents(eventName); // Optional: implement if needed
    }
  }

  provider = new MockProvider();
  prescriptionContract = new MockContract("Prescription");
  drugSupplyChainContract = new MockContract("DrugSupplyChain");
  userManagementContract = new MockContract("UserManagement");
  regulatorOversightContract = new MockContract("RegulatorOversight");
  isConnected = false;

  return { provider, prescriptionContract, drugSupplyChainContract, userManagementContract, regulatorOversightContract };
}

// Initialize blockchain on import
const blockchain = await initializeBlockchain();
const {
  provider: initializedProvider,
  prescriptionContract: initializedPrescriptionContract,
  drugSupplyChainContract: initializedDrugSupplyChainContract,
  userManagementContract: initializedUserManagementContract,
  regulatorOversightContract: initializedRegulatorOversightContract,
} = blockchain;

// Export
export {
  initializedProvider as provider,
  initializedPrescriptionContract as prescriptionContract,
  initializedDrugSupplyChainContract as drugSupplyChainContract,
  initializedUserManagementContract as userManagementContract,
  initializedRegulatorOversightContract as regulatorOversightContract,
  isConnected,
};
