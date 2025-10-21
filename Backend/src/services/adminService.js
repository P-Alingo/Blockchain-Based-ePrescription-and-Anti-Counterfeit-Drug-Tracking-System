import { prisma } from "../config/database.js";

async function getAdminByUserId(userId) {
  return prisma.admin.findUnique({ where: { userId } });
}

async function updateAdminByUserId(userId, updateData) {
  return prisma.admin.update({ where: { userId }, data: updateData });
}

export { getAdminByUserId, updateAdminByUserId };
