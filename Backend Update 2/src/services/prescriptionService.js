import { prisma } from "../config/database.js";
import { ipfs } from "../config/ipfs.js";
import * as qrCodeService from "./qrCodeService.js";

async function createPrescription(patientId, doctorId, createdByUserId, data) {
  // Store prescription data JSON on IPFS
  const { path } = await ipfs.add(JSON.stringify(data));
  const ipfsHash = path;

  // Create DB record
  const prescription = await prisma.prescription.create({
    data: {
      patientId,
      doctorId,
      ipfsHash,
      createdAt: new Date(),
    },
  });

  // Generate QR code for prescription
  const qrData = `prescription:${prescription.id}`;
  const qrCode = await qrCodeService.generateAndStoreQrCode(createdByUserId, qrData);

  // Update prescription with QR code reference
  await prisma.prescription.update({
    where: { id: prescription.id },
    data: { qrCodeId: qrCode.id },
  });

  return {
    prescription,
    qrCode,
    ipfsUrl: `https://ipfs.io/ipfs/${ipfsHash}`,
  };
}

async function getPrescriptionById(id) {
  return prisma.prescription.findUnique({
    where: { id },
    include: { patient: true, doctor: true, qrCode: true },
  });
}

async function listPrescriptions() {
  return prisma.prescription.findMany({
    include: { patient: true, doctor: true, qrCode: true },
  });
}

async function deletePrescription(id) {
  await prisma.prescription.delete({ where: { id } });
}

export { createPrescription, getPrescriptionById, listPrescriptions, deletePrescription };
