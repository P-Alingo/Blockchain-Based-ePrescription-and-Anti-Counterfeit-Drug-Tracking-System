import { prisma } from "../config/database.js";

async function getLogsByUserId(userId) {
  return prisma.activityLog.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

export { getLogsByUserId };
