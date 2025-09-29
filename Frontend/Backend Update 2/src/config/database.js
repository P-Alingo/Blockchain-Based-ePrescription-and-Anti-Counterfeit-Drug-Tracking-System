import { PrismaClient } from "@prisma/client";
import { logger } from "./logger.js";

const prisma = new PrismaClient({
  log: process.env.LOG_LEVEL === "debug" ? ["query", "info", "warn", "error"] : ["warn", "error"],
});

process.on("SIGINT", async () => {
  try {
    await prisma.$disconnect();
    logger.info("Prisma client disconnected");
  } catch (error) {
    logger.error("Error during Prisma client disconnect", error);
  }
  process.exit(0);
});

export { prisma };
