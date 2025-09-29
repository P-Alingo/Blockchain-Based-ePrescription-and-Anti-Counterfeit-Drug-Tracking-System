import { prisma } from "../config/database.js";

async function listEvents() {
  return prisma.blockchainEventLog.findMany({ orderBy: { createdAt: "desc" } });
}

async function getEventById(id) {
  return prisma.blockchainEventLog.findUnique({ where: { id } });
}

export { listEvents, getEventById };
