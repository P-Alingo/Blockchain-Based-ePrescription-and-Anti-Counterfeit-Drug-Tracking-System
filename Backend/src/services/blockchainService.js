// src/services/blockchainService.js
import {
  prescriptionContract,
  drugSupplyChainContract,
  regulatorOversightContract,
  userManagementContract,
} from "../config/ethereum.js";

/**
 * Prescription-related blockchain operations
 */
async function createPrescriptionOnChain({ doctorId, patientId, data }) {
  const tx = await prescriptionContract.createPrescription(
    doctorId.toString(),
    patientId.toString(),
    JSON.stringify(data)
  );
  const receipt = await tx.wait();
  return receipt.transactionHash;
}

async function revokePrescriptionOnChain(txHash) {
  const tx = await prescriptionContract.revokePrescription(txHash);
  const receipt = await tx.wait();
  return receipt.transactionHash;
}

async function verifyPrescriptionQRCode(qrData) {
  // Implement actual decoding and verification logic here
  return true;
}

/**
 * Drug Supply Chain operations
 */
async function createBatchOnChain({ manufacturerId, batchNumber, data }) {
  const tx = await drugSupplyChainContract.createBatch(
    manufacturerId.toString(),
    batchNumber,
    JSON.stringify(data)
  );
  const receipt = await tx.wait();
  return receipt.transactionHash;
}

async function transferBatchOwnership({ batchId, fromUserId, toUserId }) {
  const tx = await drugSupplyChainContract.transferOwnership(batchId, fromUserId, toUserId);
  const receipt = await tx.wait();
  return receipt.transactionHash;
}

async function verifyBatchQRCode(qrData) {
  // Implement actual decoding and verification logic here
  return true;
}

/**
 * User Management
 */
async function revokeAccessOnChain(userId) {
  const tx = await userManagementContract.revokeAccess(userId.toString());
  const receipt = await tx.wait();
  return receipt.transactionHash;
}

/**
 * General contract utilities
 */
async function queryContractData(contractName, methodName, params = []) {
  let contract;
  switch (contractName) {
    case "Prescription":
      contract = prescriptionContract;
      break;
    case "DrugSupplyChain":
      contract = drugSupplyChainContract;
      break;
    case "RegulatorOversight":
      contract = regulatorOversightContract;
      break;
    case "UserManagement":
      contract = userManagementContract;
      break;
    default:
      throw new Error("Invalid contract name");
  }
  return contract[methodName](...params);
}

async function upgradeContract(contractName, params) {
  // Placeholder: actual upgrade logic depends on proxy contracts
  return `Upgrade called on ${contractName} with params ${JSON.stringify(params)}`;
}

async function pauseContract(contractName) {
  return `Pause called on ${contractName}`;
}

async function unpauseContract(contractName) {
  return `Unpause called on ${contractName}`;
}

async function getBlockchainSyncStatus() {
  return {
    synced: true,
    lastBlock: await prescriptionContract.provider.getBlockNumber(),
  };
}

export default {
  // Prescription
  createPrescriptionOnChain,
  revokePrescriptionOnChain,
  verifyPrescriptionQRCode,
  
  // Drug supply
  createBatchOnChain,
  transferBatchOwnership,
  verifyBatchQRCode,
  
  // User
  revokeAccessOnChain,
  
  // General
  queryContractData,
  upgradeContract,
  pauseContract,
  unpauseContract,
  getBlockchainSyncStatus,
};
