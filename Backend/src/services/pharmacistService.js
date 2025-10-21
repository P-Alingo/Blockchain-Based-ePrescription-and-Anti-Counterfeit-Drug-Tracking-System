import { prisma } from "../config/database.js";

async function getPharmacistByUserId(userId) {
  return prisma.pharmacist.findUnique({ where: { userId } });
}

async function updatePharmacistByUserId(userId, updateData) {
  return prisma.pharmacist.update({ where: { userId }, data: updateData });
}

export { getPharmacistByUserId, updatePharmacistByUserId };
