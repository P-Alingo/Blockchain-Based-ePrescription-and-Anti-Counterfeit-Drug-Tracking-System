import prisma from "../config/database.js";
import blockchainService from "../services/blockchainService.js";
import { validateTransferInitiation, validateTransferCompletion } from "../utils/validationUtils.js";

export async function initiateTransfer(req, res, next) {
  try {
    const fromUserId = req.user.id;
    const { batchId, toUserId } = req.body;

    const validation = validateTransferInitiation({ fromUserId, batchId, toUserId });
    if (validation.error) {
      return res.status(400).json({ error: validation.error.details[0].message });
    }

    // Create transfer record with pending status
    const transfer = await prisma.transfer.create({
      data: {
        batchId,
        fromUserId,
        toUserId,
        status: "INITIATED",
      },
    });

    // Submit blockchain transaction to transfer ownership
    const blockchainTxHash = await blockchainService.transferBatchOwnership({
      batchId,
      fromUserId,
      toUserId,
    });

    // Update transfer record with tx hash
    const updatedTransfer = await prisma.transfer.update({
      where: { id: transfer.id },
      data: { blockchainTxHash },
    });

    res.status(201).json({ transfer: updatedTransfer });
  } catch (error) {
    next(error);
  }
}

export async function completeTransfer(req, res, next) {
  try {
    const toUserId = req.user.id;
    const { transferId } = req.body;

    const transfer = await prisma.transfer.findUnique({ where: { id: Number(transferId) } });
    if (!transfer) {
      return res.status(404).json({ error: "Transfer not found" });
    }
    if (transfer.toUserId !== toUserId) {
      return res.status(403).json({ error: "Not authorized to complete this transfer" });
    }
    if (transfer.status !== "INITIATED") {
      return res.status(400).json({ error: "Transfer already completed or invalid status" });
    }

    // Validate completion data if any
    const validation = validateTransferCompletion({ transferId, toUserId });
    if (validation.error) {
      return res.status(400).json({ error: validation.error.details[0].message });
    }

    // Confirm receipt on blockchain (if applicable)
    await blockchainService.confirmTransferCompletionOnChain(transfer.blockchainTxHash);

    // Update DB status
    const updatedTransfer = await prisma.transfer.update({
      where: { id: Number(transferId) },
      data: { status: "COMPLETED" },
    });

    res.json({ message: "Transfer completed", transfer: updatedTransfer });
  } catch (error) {
    next(error);
  }
}

export async function listTransfersByUser(req, res, next) {
  try {
    const { userId } = req.params;

    const transfers = await prisma.transfer.findMany({
      where: {
        OR: [{ fromUserId: Number(userId) }, { toUserId: Number(userId) }],
      },
      orderBy: { id: "desc" },
    });

    res.json(transfers);
  } catch (error) {
    next(error);
  }
}
