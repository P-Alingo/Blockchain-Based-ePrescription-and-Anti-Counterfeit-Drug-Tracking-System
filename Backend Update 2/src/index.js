import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import cors from "cors";
import { pool } from "./config/database.js";
import authRoutes from "./routes/authRoutes.js";
import usersRoutes from "./routes/usersRoutes.js";
import prescriptionRoutes from "./routes/prescriptionRoutes.js";
dotenv.config();

const app = express();

// ===============================
// Middleware
// ===============================
app.use(cors());
app.use(bodyParser.json());
app.use(express.json());


// --- Request Logger (for debugging) ---
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.url}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log("📦 Body:", req.body);
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
// Auth Routes
// ===============================
app.use("/api/auth", authRoutes);

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
console.log('\n📋 Registered Routes:');
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
app.use("/api/users", usersRoutes);
app.use("/api/prescriptions", prescriptionRoutes);
// ===============================
// Start Server
// ===============================
const PORT = process.env.BACKEND_PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
