import { prisma } from "../config/database.js";

async function getPatientByUserId(userId) {
  return prisma.patient.findUnique({ where: { userId } });
}

async function updatePatientByUserId(userId, updateData) {
  return prisma.patient.update({ where: { userId }, data: updateData });
}

export { getPatientByUserId, updatePatientByUserId };
