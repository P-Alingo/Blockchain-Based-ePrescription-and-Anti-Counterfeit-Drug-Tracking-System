// src/controllers/prescriptionController.js

import prisma from "../config/database.js";
import prescriptionService from "../services/prescriptionService.js";
import { validatePrescriptionCreation } from "../utils/validationUtils.js";

export async function createPrescription(req, res, next) {
  try {
    const doctorId = req.user.id;
    const { patientId, data } = req.body;

    // Validate input
    const validation = validatePrescriptionCreation({ doctorId, patientId, data });
    if (validation.error) {
      return res.status(400).json({ error: validation.error.details[0].message });
    }

    // Interact with blockchain via service
    const blockchainTxHash = await prescriptionService.createPrescriptionOnChain({
      patientId,
      data,
    });

    // Store in DB
    const prescription = await prisma.prescription.create({
      data: {
        doctorId,
        patientId,
        data,
        blockchainTxHash,
        revoked: false,
      },
    });

    // Generate QR code
    const qrCodeBase64 = await prescriptionService.generateQRCode(
      prescription.id,
      blockchainTxHash
    );

    res.status(201).json({ prescription, qrCodeBase64 });
  } catch (error) {
    next(error);
  }
}

export async function getPrescriptionById(req, res, next) {
  try {
    const { id } = req.params;
    const prescription = await prisma.prescription.findUnique({
      where: { id: Number(id) },
      include: {
        doctor: { select: { id: true, address: true, metadata: true } },
        patient: { select: { id: true, address: true, metadata: true } },
      },
    });

    if (!prescription) return res.status(404).json({ error: "Prescription not found" });

    res.json(prescription);
  } catch (error) {
    next(error);
  }
}

export async function listPrescriptionsByUser(req, res, next) {
  try {
    const { userId } = req.params;

    const prescriptions = await prisma.prescription.findMany({
      where: {
        OR: [{ doctorId: Number(userId) }, { patientId: Number(userId) }],
      },
      orderBy: { id: "desc" },
    });

    res.json(prescriptions);
  } catch (error) {
    next(error);
  }
}

export async function revokePrescription(req, res, next) {
  try {
    const doctorId = req.user.id;
    const { id } = req.params;

    const prescription = await prisma.prescription.findUnique({ where: { id: Number(id) } });
    if (!prescription) return res.status(404).json({ error: "Prescription not found" });

    if (prescription.doctorId !== doctorId)
      return res.status(403).json({ error: "Only the prescribing doctor can revoke" });

    if (prescription.revoked) return res.status(400).json({ error: "Prescription already revoked" });

    // Revoke via service
    await prescriptionService.revokePrescriptionOnChain(prescription.blockchainTxHash);

    const updatedPrescription = await prisma.prescription.update({
      where: { id: Number(id) },
      data: { revoked: true },
    });

    res.json({ message: "Prescription revoked", prescription: updatedPrescription });
  } catch (error) {
    next(error);
  }
}

export async function verifyPrescriptionQRCode(req, res, next) {
  try {
    const { qrData } = req.body;
    if (!qrData) return res.status(400).json({ error: "QR data is required" });

    const isValid = await prescriptionService.verifyQRCode(qrData);
    res.json({ valid: isValid });
  } catch (error) {
    next(error);
  }
}
