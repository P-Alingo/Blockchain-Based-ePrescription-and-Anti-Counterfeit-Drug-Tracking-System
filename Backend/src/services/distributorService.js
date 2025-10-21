import { prisma } from "../config/database.js";

async function getDistributorByUserId(userId) {
  return prisma.distributor.findUnique({ where: { userId } });
}

async function updateDistributorByUserId(userId, updateData) {
  return prisma.distributor.update({ where: { userId }, data: updateData });
}

export { getDistributorByUserId, updateDistributorByUserId };
