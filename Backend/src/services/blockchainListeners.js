import { ethers } from "ethers";
import {
  prescriptionContract,
  drugSupplyChainContract,
  regulatorOversightContract,
  userManagementContract,
} from "../config/ethereum.js";

export default async function blockchainListeners(prisma) {
  // PrescriptionCreated event
  prescriptionContract.on("PrescriptionCreated", async (prescriptionId, doctorId, patientId, event) => {
    try {
      const txHash = event.transactionHash;
      const exists = await prisma.prescription.findUnique({ where: { blockchainTxHash: txHash } });
      if (exists) return; // deduplicate

      await prisma.prescription.create({
        data: {
          id: Number(prescriptionId),
          doctorId: Number(doctorId),
          patientId: Number(patientId),
          blockchainTxHash: txHash,
          revoked: false,
          data: "On-chain data - sync logic needed",
        },
      });
    } catch (error) {
      console.error("Error on PrescriptionCreated event:", error);
    }
  });

  // BatchCreated event
  drugSupplyChainContract.on("BatchCreated", async (batchId, manufacturerId, batchNumber, event) => {
    try {
      const txHash = event.transactionHash;
      const exists = await prisma.batch.findUnique({ where: { blockchainTxHash: txHash } });
      if (exists) return;

      await prisma.batch.create({
        data: {
          id: Number(batchId),
          manufacturerId: Number(manufacturerId),
          batchNumber,
          blockchainTxHash: txHash,
          data: "On-chain data - sync logic needed",
        },
      });
    } catch (error) {
      console.error("Error on BatchCreated event:", error);
    }
  });

  // TransferInitiated event
  drugSupplyChainContract.on(
    "TransferInitiated",
    async (transferId, batchId, fromUserId, toUserId, event) => {
      try {
        const txHash = event.transactionHash;
        const exists = await prisma.transfer.findUnique({ where: { blockchainTxHash: txHash } });
        if (exists) return;

        await prisma.transfer.create({
          data: {
            id: Number(transferId),
            batchId: Number(batchId),
            fromUserId: Number(fromUserId),
            toUserId: Number(toUserId),
            status: "INITIATED",
            blockchainTxHash: txHash,
          },
        });
      } catch (error) {
        console.error("Error on TransferInitiated event:", error);
      }
    }
  );

  // TransferCompleted event
  drugSupplyChainContract.on("TransferCompleted", async (transferId, event) => {
    try {
      const transfer = await prisma.transfer.findUnique({ where: { id: Number(transferId) } });
      if (!transfer) return;

      await prisma.transfer.update({
        where: { id: Number(transferId) },
        data: { status: "COMPLETED" },
      });
    } catch (error) {
      console.error("Error on TransferCompleted event:", error);
    }
  });

  // AccessRevoked event
  userManagementContract.on("AccessRevoked", async (userId, event) => {
    try {
      await prisma.user.update({
        where: { id: Number(userId) },
        data: { accessRevoked: true },
      });
    } catch (error) {
      console.error("Error on AccessRevoked event:", error);
    }
  });
}
