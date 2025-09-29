import { prisma } from "../config/database.js";

async function getRegulatorByUserId(userId) {
  return prisma.regulator.findUnique({ where: { userId } });
}

async function updateRegulatorByUserId(userId, updateData) {
  return prisma.regulator.update({ where: { userId }, data: updateData });
}

export { getRegulatorByUserId, updateRegulatorByUserId };
