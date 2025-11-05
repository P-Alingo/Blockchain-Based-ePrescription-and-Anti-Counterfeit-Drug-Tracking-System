import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import cors from "cors";
import { pool } from "./config/database.js";
import authRoutes from "./routes/authRoutes.js";
import patientRoutes from "./routes/patientRoutes.js";
import doctorRoutes from "./routes/doctorRoutes.js";
import manufacturerRoutes from './routes/manufacturerRoutes.js';
import distributorRoutes from './routes/distributorRoutes.js';
import pharmacistRoutes from './routes/pharmacistRoutes.js';
import regulatorRoutes from './routes/regulatorRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import userManagementRoutes from './routes/userManagementRoutes.js';
import drugBatchRoutes from "./routes/drugBatchRoutes.js";
import shipmentRoutes from "./routes/shipmentRoutes.js";
import prescriptionRoutes from './routes/prescriptionRoutes.js';
import qrCodeRoutes from './routes/qrCodeRoutes.js';
import blockchainEventLogRoutes from './routes/blockchainEventLogRoutes.js';
import drugSupplyChainRoutes from './routes/drugSupplyChainRoutes.js';
import fileRoutes from './routes/fileRoutes.js';
import regulatorOversightRoutes from './routes/regulatorOversightRoutes.js';
dotenv.config();

const app = express();


import path from "path";
// ===============================
// Middleware
// ===============================
app.use(cors());
app.use(bodyParser.json());
app.use(express.json());

// Serve uploads directory for QR code images and other files
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));


// --- Request Logger (for debugging) ---
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.url}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log(" Body:", req.body);
  }
  next();
});

// ===============================
// Health Check Route
// ===============================
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Server is running!" });
});

// ===============================
// Auth & Role Routes
// ===============================
app.use("/api/auth", authRoutes);
app.use("/api/patient", patientRoutes);
app.use("/api/doctor", doctorRoutes);
app.use("/api/manufacturer", manufacturerRoutes);
app.use("/api/distributor", distributorRoutes);
app.use("/api/pharmacist", pharmacistRoutes);
app.use("/api/regulator", regulatorRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/prescription", prescriptionRoutes);
app.use("/api/qrcode", qrCodeRoutes);
app.use("/api/blockchain-event-log", blockchainEventLogRoutes);
app.use("/api/drug-supply-chain", drugSupplyChainRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/regulator-oversight", regulatorOversightRoutes);
// ===============================
// Test Database Connection
// ===============================
(async () => {
  try {
    const res = await pool.query("SELECT NOW()");
    console.log("✅ Connected to PostgreSQL at:", res.rows[0].now);
  } catch (err) {
    console.error("❌ Failed to connect to PostgreSQL:", err.message);
  }
})();

// 🔍 Debug: Print all registered routes
console.log('\n Registered Routes:');
app._router.stack.forEach((middleware) => {
  if (middleware.route) {
    console.log(`  ${Object.keys(middleware.route.methods)[0].toUpperCase()} ${middleware.route.path}`);
  } else if (middleware.name === 'router') {
    middleware.handle.stack.forEach((handler) => {
      if (handler.route) {
        const path = middleware.regexp.toString().replace('/^\\', '').replace('\\/?(?=\\/|$)/i', '');
        console.log(`  ${Object.keys(handler.route.methods)[0].toUpperCase()} ${path}${handler.route.path}`);
      }
    });
  }
});

app.use('/api/users', userManagementRoutes);
app.use("/api/drugbatch", drugBatchRoutes);
app.use('/api/shipments', shipmentRoutes);
// ===============================
// Start Server
// ===============================
const PORT = process.env.BACKEND_PORT || 4000;
app.listen(PORT, () => {
  console.log(` Server running on http://localhost:${PORT}`);
});
