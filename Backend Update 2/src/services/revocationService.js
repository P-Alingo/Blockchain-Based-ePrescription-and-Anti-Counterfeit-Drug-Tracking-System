import { prisma } from "../config/database.js";

async function createRevocation(data) {
  return prisma.revocationRecord.create({
    data: {
      prescriptionId: data.prescriptionId,
      revokedById: data.revokedById,
      reason: data.reason,
      revokedAt: new Date(),
    },
  });
}

async function listRevocations() {
  return prisma.revocationRecord.findMany();
}

export { createRevocation, listRevocations };
