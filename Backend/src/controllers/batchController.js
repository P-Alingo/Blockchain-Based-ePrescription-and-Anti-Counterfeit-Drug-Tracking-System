import prisma from "../config/database.js";
import blockchainService from "../services/blockchainService.js";
import { validateBatchCreation } from "../utils/validationUtils.js";
import { generateBatchQRCode } from "../services/qrCodeService.js";

export async function createBatch(req, res, next) {
  try {
    const manufacturerId = req.user.id;
    const { batchNumber, data } = req.body;

    const validation = validateBatchCreation({ manufacturerId, batchNumber, data });
    if (validation.error) {
      return res.status(400).json({ error: validation.error.details[0].message });
    }

    // Register batch on blockchain
    const blockchainTxHash = await blockchainService.createBatchOnChain({
      manufacturerId,
      batchNumber,
      data,
    });

    // Store in DB
    const batch = await prisma.batch.create({
      data: {
        manufacturerId,
        batchNumber,
        data,
        blockchainTxHash,
      },
    });

    // Generate QR code
    const qrCodeBase64 = await generateBatchQRCode({
      batchId: batch.id,
      blockchainTxHash,
    });

    res.status(201).json({ batch, qrCodeBase64 });
  } catch (error) {
    next(error);
  }
}

export async function getBatchById(req, res, next) {
  try {
    const { id } = req.params;
    const batch = await prisma.batch.findUnique({
      where: { id: Number(id) },
      include: {
        manufacturer: { select: { id: true, address: true, metadata: true } },
      },
    });
    if (!batch) {
      return res.status(404).json({ error: "Batch not found" });
    }
    res.json(batch);
  } catch (error) {
    next(error);
  }
}

export async function listBatchesByManufacturer(req, res, next) {
  try {
    const { id } = req.params;
    const batches = await prisma.batch.findMany({
      where: { manufacturerId: Number(id) },
      orderBy: { id: "desc" },
    });
    res.json(batches);
  } catch (error) {
    next(error);
  }
}

export async function verifyBatchQRCode(req, res, next) {
  try {
    const { qrData } = req.body;
    if (!qrData) {
      return res.status(400).json({ error: "QR data is required" });
    }
    const isValid = await blockchainService.verifyBatchQRCode(qrData);
    res.json({ valid: isValid });
  } catch (error) {
    next(error);
  }
}
