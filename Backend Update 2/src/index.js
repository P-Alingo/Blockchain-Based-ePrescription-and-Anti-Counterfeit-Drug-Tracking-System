// index.js
import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import cors from "cors";
import { 
  registerRequestOtpService, 
  verifyOtpService, 
  loginRequestOtpService, 
  loginVerifyOtpService 
} from "./services/authService.js";
import { generateJwt } from "./utils/jwtUtils.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// --- Request logger ---
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.url}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log("📦 Body:", req.body);
  }
  next();
});

// --- Health check ---
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Server is running!" });
});

// -----------------------------
// Registration - Request OTP
// -----------------------------
app.post("/api/register", async (req, res) => {
  try {
    const result = await registerRequestOtpService(req.body);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message || "Failed to register" });
  }
});

// -----------------------------
// Registration - Verify OTP
// -----------------------------
app.post("/api/register-verify-otp", async (req, res) => {
  try {
    const result = await verifyOtpService(req.body);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message || "Failed to verify OTP" });
  }
});

// -----------------------------
// Login - Request OTP
// -----------------------------
app.post("/api/login-request-otp", async (req, res) => {
  try {
    const result = await loginRequestOtpService(req.body);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message || "Failed to send OTP. Make sure registration OTP is verified first." });
  }
});

// -----------------------------
// Login - Verify OTP
// -----------------------------
app.post("/api/login-verify-otp", async (req, res) => {
  try {
    const result = await loginVerifyOtpService(req.body);

    // Generate JWT
    const token = generateJwt({ userId: result.userId, role: result.role });

    // Send role-based dashboard URL (7 actors)
    let dashboardUrl = '/dashboard';
    switch (result.role.toLowerCase()) {
      case 'patient':
        dashboardUrl = '/patient/dashboard';
        break;
      case 'doctor':
        dashboardUrl = '/doctor/dashboard';
        break;
      case 'admin':
        dashboardUrl = '/admin/dashboard';
        break;
      case 'pharmacist':
        dashboardUrl = '/pharmacist/dashboard';
        break;
      case 'distributor':
        dashboardUrl = '/distributor/dashboard';
        break;
      case 'manufacturer':
        dashboardUrl = '/manufacturer/dashboard';
        break;
      case 'regulator':
        dashboardUrl = '/regulator/dashboard';
        break;
    }

    res.json({ success: true, message: result.message, email: result.email, token, dashboardUrl, role: result.role });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message || "Failed to verify OTP" });
  }
});

import { pool } from './config/database.js';

(async () => {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('✅ Connected to PostgreSQL at:', res.rows[0].now);
  } catch (err) {
    console.error('❌ Failed to connect to PostgreSQL:', err.message);
  }
})();


// --- Start server ---
const PORT = process.env.BACKEND_PORT || 4000;
app.listen(PORT, () => {
  console.log(` Server running on http://localhost:${PORT}`);
});
