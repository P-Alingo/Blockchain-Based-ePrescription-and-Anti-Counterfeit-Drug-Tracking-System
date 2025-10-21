import { prisma } from "../config/database.js";

async function getAlertsByUserId(userId) {
  return prisma.alert.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

async function markAlertRead(id) {
  return prisma.alert.update({
    where: { id },
    data: { read: true },
  });
}

export { getAlertsByUserId, markAlertRead };
