import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import pkg from "pg";
import cors from "cors";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { sendOtpEmail } from "./utils/emailSender.js";

dotenv.config();
const { Pool } = pkg;

const app = express();
app.use(cors());
app.use(bodyParser.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// --- Test DB connection ---
pool.query("SELECT NOW()", (err, res) => {
  if (err) console.error("❌ DB connection error:", err);
  else console.log("✅ DB connected:", res.rows[0]);
});

const JWT_SECRET = process.env.JWT_SECRET;
const OTP_EXPIRATION_MINUTES = parseInt(process.env.OTP_EXPIRATION_MINUTES || "10");

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.url}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('📦 Body:', req.body);
  }
  next();
});

// --- HEALTH CHECK ---
app.get("/api/health", (req, res) => {
  console.log("✅ Health check hit!");
  res.json({ status: "OK", message: "Server is running!" });
});

// --- CHECK USER EXISTS ---
app.post("/api/check-user", async (req, res) => {
  console.log("👉 /api/check-user hit with:", req.body);

  const { walletAddress, email } = req.body;
  
  try {
    let query;
    let params;

    if (walletAddress) {
      query = "SELECT * FROM users WHERE wallet_address=$1";
      params = [walletAddress];
    } else if (email) {
      query = "SELECT * FROM users WHERE email=$1";
      params = [email];
    } else {
      return res.status(400).json({ error: "Wallet address or email required" });
    }

    const result = await pool.query(query, params);
    console.log("✅ User exists check:", result.rows.length > 0);
    res.json({ exists: result.rows.length > 0 });
  } catch (err) {
    console.error("❌ Check user error:", err);
    res.status(500).json({ error: err.detail || err.message || "Server error" });
  }
});

// --- REGISTER ---
app.post("/api/register", async (req, res) => {
  console.log("👉 /api/register hit with:", req.body);

  const { address, email, role } = req.body;
  if (!address || !email || !role)
    return res.status(400).json({ error: "Wallet, email, and role required" });

  try {
    // Check if email already exists
    const existing = await pool.query("SELECT * FROM users WHERE email=$1", [email]);
    if (existing.rows.length > 0)
      return res.status(400).json({ error: "Email already registered" });

    // Check if wallet already exists
    const existingWallet = await pool.query("SELECT * FROM users WHERE wallet_address=$1", [address]);
    if (existingWallet.rows.length > 0)
      return res.status(400).json({ error: "Wallet already registered" });

    // Create user first
    const userResult = await pool.query(
      "INSERT INTO users (wallet_address, email, role) VALUES ($1,$2,$3) RETURNING *",
      [address, email, role]
    );

    const user = userResult.rows[0];

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");

    // Store OTP with user_id
    await pool.query(
      `INSERT INTO otps (user_id, otp_hash, expires_at) VALUES ($1,$2, NOW() + interval '${OTP_EXPIRATION_MINUTES} minutes')`,
      [user.id, otpHash]
    );

    // Use Brevo to send email
    await sendOtpEmail(email, otp);
    
    console.log("✅ Registration OTP sent to:", email);
    res.json({ message: "OTP sent to email for registration" });
  } catch (err) {
    console.error("❌ Register error:", err);
    res.status(500).json({ error: err.detail || err.message || "Server error" });
  }
});

// --- LOGIN REQUEST OTP ---
app.post("/api/login/request-otp", async (req, res) => {
  console.log("👉 /api/login/request-otp hit with:", req.body);

  const { address, email } = req.body;
  if (!address || !email)
    return res.status(400).json({ error: "Wallet address and email required" });

  try {
    const userRes = await pool.query(
      "SELECT * FROM users WHERE email=$1 AND wallet_address=$2",
      [email, address]
    );

    if (userRes.rows.length === 0)
      return res.status(400).json({ error: "User not found" });

    const user = userRes.rows[0];

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");

    await pool.query(
      `INSERT INTO otps (user_id, otp_hash, expires_at) VALUES ($1,$2, NOW() + interval '${OTP_EXPIRATION_MINUTES} minutes')`,
      [user.id, otpHash]
    );

    // Use Brevo to send email
    await sendOtpEmail(email, otp);

    console.log("✅ Login OTP sent to:", email);
    res.json({ message: "OTP sent to your email" });
  } catch (err) {
    console.error("❌ Login request OTP error:", err);
    res.status(500).json({ error: err.detail || err.message || "Server error" });
  }
});

// --- VERIFY OTP ---
app.post("/api/verify-otp", async (req, res) => {
  console.log("👉 /api/verify-otp hit with:", req.body);

  const { address, otp } = req.body;
  if (!address || !otp)
    return res.status(400).json({ error: "Wallet address and OTP required" });

  try {
    // Get user by wallet address
    const userRes = await pool.query("SELECT * FROM users WHERE wallet_address=$1", [address]);
    if (userRes.rows.length === 0)
      return res.status(400).json({ error: "User not found" });

    const user = userRes.rows[0];

    // Get the most recent OTP for this user
    const otpRes = await pool.query(
      "SELECT * FROM otps WHERE user_id=$1 ORDER BY created_at DESC LIMIT 1",
      [user.id]
    );

    if (otpRes.rows.length === 0)
      return res.status(400).json({ error: "No OTP found" });

    const otpRow = otpRes.rows[0];
    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");

    if (otpHash !== otpRow.otp_hash)
      return res.status(400).json({ error: "Invalid OTP" });
    if (new Date(otpRow.expires_at) < new Date())
      return res.status(400).json({ error: "OTP expired" });

    const token = jwt.sign({ userId: user.id, walletAddress: address, email: user.email }, JWT_SECRET, {
      expiresIn: "1h",
    });

    console.log("✅ OTP verified for:", user.email);
    res.json({ message: "OTP verified. Login successful", token, email: user.email });
  } catch (err) {
    console.error("❌ Verify OTP error:", err);
    res.status(500).json({ error: err.detail || err.message || "Server error" });
  }
});

// --- START SERVER ---
const PORT = process.env.BACKEND_PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📋 Available endpoints:`);
  console.log(`   GET  /api/health`);
  console.log(`   POST /api/check-user`);
  console.log(`   POST /api/register`);
  console.log(`   POST /api/login/request-otp`);
  console.log(`   POST /api/verify-otp`);
});