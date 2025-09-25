import prisma from "../config/database.js";

export async function logAction(userId, actionType, targetId, description) {
  await prisma.auditLog.create({
    data: {
      userId,
      actionType,
      targetId,
      description,
      timestamp: new Date(),
    },
  });
}

export async function fetchLogs(filterParams) {
  const { userId, actionType, targetId, startDate, endDate } = filterParams;

  const where = {};
  if (userId) where.userId = userId;
  if (actionType) where.actionType = actionType;
  if (targetId) where.targetId = targetId;
  if (startDate || endDate) {
    where.timestamp = {};
    if (startDate) where.timestamp.gte = startDate;
    if (endDate) where.timestamp.lte = endDate;
  }

  return prisma.auditLog.findMany({
    where,
    orderBy: { timestamp: "desc" },
  });
}

export default { logAction, fetchLogs };
