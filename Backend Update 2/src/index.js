import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";

import "./config/dotenv.js";
import { logger } from "./config/logger.js";
import { prisma } from "./config/database.js";
import { 
  listenToContractEvents, 
  prescriptionContract, 
  drugSupplyChainContract,
  userManagementContract,
  regulatorOversightContract 
} from "./config/blockchain.js";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import roleRoutes from "./routes/roleRoutes.js";
import doctorRoutes from "./routes/doctorRoutes.js";
import patientRoutes from "./routes/patientRoutes.js";
import pharmacistRoutes from "./routes/pharmacistRoutes.js";
import manufacturerRoutes from "./routes/manufacturerRoutes.js";
import distributorRoutes from "./routes/distributorRoutes.js";
import regulatorRoutes from "./routes/regulatorRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import prescriptionRoutes from "./routes/prescriptionRoutes.js";
import drugBatchRoutes from "./routes/drugBatchRoutes.js";
import supplyChainRoutes from "./routes/supplyChainRoutes.js";
import qrCodeRoutes from "./routes/qrCodeRoutes.js";
import activityLogRoutes from "./routes/activityLogRoutes.js";
import alertRoutes from "./routes/alertRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import blockchainEventLogRoutes from "./routes/blockchainEventLogRoutes.js";
import revocationRoutes from "./routes/revocationRoutes.js";
import dispenseRecordRoutes from "./routes/dispenseRecordRoutes.js";

import { errorHandler } from "./middleware/errorHandler.js";
import { rateLimiter } from "./middleware/rateLimiter.js";
import { requestLogger } from "./middleware/requestLogger.js";
import { jsonParser } from "./middleware/jsonParser.js";

const app = express();

app.use(cors());
app.use(jsonParser);
app.use(rateLimiter);
app.use(requestLogger);

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/pharmacists", pharmacistRoutes);
app.use("/api/manufacturers", manufacturerRoutes);
app.use("/api/distributors", distributorRoutes);
app.use("/api/regulators", regulatorRoutes);
app.use("/api/admins", adminRoutes);
app.use("/api/prescriptions", prescriptionRoutes);
app.use("/api/drugbatches", drugBatchRoutes);
app.use("/api/supplychain", supplyChainRoutes);
app.use("/api/qrcodes", qrCodeRoutes);
app.use("/api/activitylogs", activityLogRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/blockchainevents", blockchainEventLogRoutes);
app.use("/api/revocations", revocationRoutes);
app.use("/api/dispenserecords", dispenseRecordRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 4000;

async function startServer() {
  try {
    await prisma.$connect();
    logger.info("Connected to database");
    await listenToContractEvents(contract, prisma, logger);
    app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    logger.error("Failed to start server", error);
    process.exit(1);
  }
}

await listenToContractEvents(
  { 
    prescriptionContract, 
    drugSupplyChainContract,
    userManagementContract,
    regulatorOversightContract 
  }, 
  prisma, 
  logger
);