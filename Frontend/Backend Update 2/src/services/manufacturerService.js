import { prisma } from "../config/database.js";

async function getManufacturerByUserId(userId) {
  return prisma.manufacturer.findUnique({ where: { userId } });
}

async function updateManufacturerByUserId(userId, updateData) {
  return prisma.manufacturer.update({ where: { userId }, data: updateData });
}

export { getManufacturerByUserId, updateManufacturerByUserId };
