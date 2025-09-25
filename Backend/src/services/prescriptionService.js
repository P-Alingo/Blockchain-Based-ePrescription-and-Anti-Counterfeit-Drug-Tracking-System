// src/services/prescriptionService.js

import { prescription } from "../utils/contracts.js";
import { ethers } from "ethers";
import { generatePrescriptionQRCode } from "./qrCodeService.js";

class PrescriptionService {
  constructor(doctorSigner, pharmacistSigner) {
    // Assign signers for creating and verifying prescriptions
    this.doctorSigner = doctorSigner;
    this.pharmacistSigner = pharmacistSigner;
  }

  /**
   * Create a prescription on the blockchain
   * @param {Number} patientId 
   * @param {String} data - Prescription details
   * @returns {String} transactionHash
   */
  async createPrescriptionOnChain({ patientId, data }) {
    try {
      const tx = await prescription.connect(this.doctorSigner).createPrescription(patientId, data);
      const receipt = await tx.wait(); // Wait for confirmation
      return receipt.transactionHash;
    } catch (err) {
      console.error("Error creating prescription on chain:", err);
      throw new Error("Blockchain prescription creation failed");
    }
  }

  /**
   * Verify a prescription on chain (by pharmacist)
   * @param {Number} prescriptionId
   * @returns {Boolean} success
   */
  async verifyPrescriptionOnChain(prescriptionId) {
    try {
      const tx = await prescription.connect(this.pharmacistSigner).verifyPrescription(prescriptionId);
      await tx.wait();
      return true;
    } catch (err) {
      console.error("Error verifying prescription:", err);
      return false;
    }
  }

  /**
   * Revoke a prescription on chain
   * @param {String} txHash - Blockchain transaction hash
   */
  async revokePrescriptionOnChain(txHash) {
    try {
      const tx = await prescription.connect(this.doctorSigner).revokePrescription(txHash);
      await tx.wait();
      return true;
    } catch (err) {
      console.error("Error revoking prescription:", err);
      throw new Error("Blockchain prescription revocation failed");
    }
  }

  /**
   * Generate a QR code for a prescription
   * @param {Number} prescriptionId 
   * @param {String} blockchainTxHash 
   * @returns {String} Base64 QR code
   */
  async generateQRCode(prescriptionId, blockchainTxHash) {
    try {
      return await generatePrescriptionQRCode({ prescriptionId, blockchainTxHash });
    } catch (err) {
      console.error("Error generating QR code:", err);
      throw new Error("QR code generation failed");
    }
  }

  /**
   * Verify QR code authenticity
   * @param {String} qrData
   * @returns {Boolean}
   */
  async verifyQRCode(qrData) {
    try {
      // Decode QR and verify on blockchain
      const txHash = qrData; // Adjust this according to your QR encoding
      const isValid = await prescription.isValid(txHash); // Example function
      return isValid;
    } catch (err) {
      console.error("Error verifying QR code:", err);
      return false;
    }
  }

  /**
   * Helper to simulate full prescription workflow
   */
  async simulatePrescriptionFlow(patientId, data) {
    const txHash = await this.createPrescriptionOnChain({ patientId, data });
    const qrCode = await this.generateQRCode(Date.now(), txHash); // Use prescription ID here
    const verified = await this.verifyPrescriptionOnChain(Date.now()); // Replace with actual ID
    return { txHash, qrCode, verified };
  }
}

// Export a singleton service if using global signers
// You can assign actual doctor and pharmacist signers here from Hardhat setup
export default new PrescriptionService(
  global.doctor, // signer for doctor
  global.pharmacist // signer for pharmacist
);
