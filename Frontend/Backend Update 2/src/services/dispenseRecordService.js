import { prisma } from "../config/database.js";

async function createDispenseRecord(data) {
  return prisma.dispenseRecord.create({
    data: {
      prescriptionId: data.prescriptionId,
      pharmacistId: data.pharmacistId,
      quantity: data.quantity,
      dispensedAt: new Date(),
    },
  });
}

async function listDispenseRecords() {
  return prisma.dispenseRecord.findMany();
}

export { createDispenseRecord, listDispenseRecords };
