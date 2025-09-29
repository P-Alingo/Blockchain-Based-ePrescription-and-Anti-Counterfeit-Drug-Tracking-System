import { prisma } from "../config/database.js";

async function recordEvent(eventData) {
  const { drugBatchId, fromEntityId, toEntityId, eventType, transactionHash } = eventData;
  return prisma.supplyChainRecord.create({
    data: {
      drugBatchId,
      fromEntityId,
      toEntityId,
      eventType,
      transactionHash,
      timestamp: new Date(),
      createdAt: new Date(),
    },
  });
}

async function listEvents() {
  return prisma.supplyChainRecord.findMany();
}

export { recordEvent, listEvents };
