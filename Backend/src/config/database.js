import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient({
  errorFormat: "colorless",
  log: ["query", "error", "warn", "info"],
});

prisma
  .$connect()
  .then(() => console.log("Connected to PostgreSQL via Prisma"))
  .catch((err) => {
    console.error("Error connecting to the database", err);
    process.exit(1);
  });

export default prisma;
