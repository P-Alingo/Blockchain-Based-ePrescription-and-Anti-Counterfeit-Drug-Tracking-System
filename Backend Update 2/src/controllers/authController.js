// src/controllers/authController.js - WITH DEBUG LOGGING
import {
  registerRequestOtpService,
  verifyOtpService,
  loginRequestOtpService,
  loginVerifyOtpService,
} from "../services/authService.js";
import { generateJwt } from "../utils/jwtUtils.js";
import { userManagementContract } from "../config/blockchain.js";
import { query } from "../config/database.js";
import { ethers } from "ethers";


// =======================================================
// Helper: Register user on blockchain
// =======================================================
async function registerOnChainUser(walletAddress, role) {
  try {
    if (!walletAddress || !role)
      throw new Error("Missing wallet address or role");

    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey)
      throw new Error("Missing PRIVATE_KEY in environment variables");

    const provider =
      userManagementContract.runner?.provider ||
      userManagementContract.provider ||
      new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL);

    const signer = new ethers.Wallet(privateKey, provider);
    const contractWithSigner = userManagementContract.connect(signer);

    const tx = await contractWithSigner.registerUser(
      walletAddress,
      role,
      "Registered via OTP verification"
    );
    await tx.wait();

    console.log(`✅ On-chain registration: ${walletAddress} as ${role}`);
    return true;
  } catch (err) {
    console.warn(`⚠️ Blockchain registration skipped: ${err.message}`);
    return false;
  }
}

// =======================================================
// 1️⃣ Register Request OTP
// =======================================================
export async function registerRequestOtp(req, res) {
  try {
    console.log("📨 Register Request OTP - Body:", req.body);
    const result = await registerRequestOtpService(req.body);
    res.json({ success: true, ...result });
  } catch (err) {
    console.error("❌ Register Request OTP Error:", err);
    res.status(err.status || 500).json({
      success: false,
      error: err.message || "Failed to send OTP",
    });
  }
}

// =======================================================
// 2️⃣ Verify OTP (Registration)
// =======================================================
export async function verifyOtp(req, res) {
  try {
    console.log("📨 Verify Registration OTP - Body:", req.body);
    const result = await verifyOtpService(req.body);

    const userId = result.userId;
    if (!userId)
      throw { status: 500, message: "Missing userId from verification result" };

    // Fetch wallet + role (for JWT)
    const { rows } = await query(
      "SELECT id, wallet_address, role, email FROM users WHERE id = $1",
      [userId]
    );
    const user = rows[0];
    if (!user) throw { status: 404, message: "User not found after verification" };

    const { wallet_address: walletAddress, role, email } = user;

    // ✅ Generate JWT
    const token = generateJwt({
      userId: user.id,
      role,
      walletAddress,
    });

    // 🧱 Attempt blockchain registration (non-blocking)
    registerOnChainUser(walletAddress, role).catch(console.warn);

    // 🔗 Dashboard redirect map
    const dashboardMap = {
      patient: "/patient/dashboard",
      doctor: "/doctor/dashboard",
      pharmacist: "/pharmacist/dashboard",
      manufacturer: "/manufacturer/dashboard",
      distributor: "/distributor/dashboard",
      regulator: "/regulator/dashboard",
      admin: "/admin/dashboard",
    };

    const dashboardUrl = dashboardMap[role?.toLowerCase()] || "/dashboard";

    res.json({
      success: true,
      message: result.message,
      email,
      walletAddress,
      role,
      token,
      dashboardUrl,
    });
  } catch (err) {
    console.error("❌ Verify OTP Error:", err);
    res.status(err.status || 500).json({
      success: false,
      error: err.message || "Failed to verify OTP",
    });
  }
}

// =======================================================
// 3️⃣ Login Request OTP - WITH ENHANCED LOGGING
// =======================================================
export async function loginRequestOtp(req, res) {
  console.log("\n🟢 ========== LOGIN REQUEST OTP ==========");
  console.log("📨 Request Body:", JSON.stringify(req.body, null, 2));
  console.log("📍 Endpoint Hit:", req.path);
  console.log("🌐 Full URL:", req.originalUrl);
  
  try {
    const { walletAddress, email } = req.body;
    
    // Validate input
    if (!walletAddress || !email) {
      console.error("❌ Missing required fields");
      return res.status(400).json({
        success: false,
        error: "Wallet address and email are required",
      });
    }

    console.log("✅ Input validation passed");
    console.log("🔄 Calling loginRequestOtpService...");
    
    const result = await loginRequestOtpService(req.body);
    
    console.log("✅ Service returned:", result);
    console.log("🟢 ========== REQUEST OTP SUCCESS ==========\n");
    
    res.json({ success: true, ...result });
  } catch (err) {
    console.error("\n❌ ========== LOGIN REQUEST OTP ERROR ==========");
    console.error("Error Type:", err.constructor.name);
    console.error("Error Status:", err.status);
    console.error("Error Message:", err.message);
    console.error("Full Error:", err);
    console.error("Stack Trace:", err.stack);
    console.error("❌ ========================================\n");
    
    res.status(err.status || 500).json({
      success: false,
      error: err.message || "Failed to send login OTP",
    });
  }
}

// =======================================================
// 4️⃣ Login Verify OTP
// =======================================================
export async function loginVerifyOtp(req, res) {
  console.log('\n🟡 ========== LOGIN VERIFY OTP ==========');
  console.log('📨 Request Body:', JSON.stringify(req.body, null, 2));
  
  try {
    const result = await loginVerifyOtpService(req.body);
    
    console.log('✅ loginVerifyOtpService returned:', result);

    // CRITICAL: Check if userId exists in the result
    if (!result.userId) {
      console.error('❌ CRITICAL: Missing userId from service. Full result:', result);
      throw { status: 500, message: "Missing userId from login verification" };
    }

    console.log(`✅ User ID verified: ${result.userId}`);

    // ✅ Generate JWT using the userId from the service result
    const token = generateJwt({
      userId: result.userId,
      role: result.role,
      walletAddress: result.walletAddress,
      email: result.email
    });

    console.log(`✅ JWT generated successfully for user: ${result.userId}`);

    // Return the complete response
    const responseData = {
      success: true,
      message: result.message || "Login successful",
      token: token,
      id: result.userId,
      role: result.role,
      email: result.email,
      walletAddress: result.walletAddress,
      fullName: result.fullName,
      userCode: result.userCode
    };

    console.log('✅ Sending successful response to frontend');
    console.log('🟢 ========== VERIFY OTP SUCCESS ==========\n');
    
    res.json(responseData);

  } catch (err) {
    console.error("\n❌ ========== LOGIN VERIFY OTP ERROR ==========");
    console.error("Error:", {
      message: err.message,
      status: err.status,
      stack: err.stack
    });
    console.error("❌ ==========================================\n");
    
    res.status(err.status || 500).json({
      success: false,
      error: err.message || "Failed to verify login OTP",
    });
  }

}

/**
 * Search for patients in the users table
 */
export const searchAuthController = async (req, res) => {
  try {
    const { query: searchTerm } = req.query;  // ✅ renamed from "query" to "searchTerm"

    if (!searchTerm) {
      return res.status(400).json({ message: "Query parameter is required" });
    }

    const sql = `
      SELECT id, full_name, email, phone_number, gender, dob, user_code
      FROM users
      WHERE role = 'patient'
        AND (
          full_name ILIKE $1 OR
          email ILIKE $1 OR
          phone_number ILIKE $1 OR
          user_code ILIKE $1
        )
    `;

    const values = [`%${searchTerm}%`];
    const result = await query(sql, values); // ✅ now correctly calls your DB helper

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "No patient found" });
    }

    const formatted = result.rows.map((row) => ({
      id: row.id,
      fullName: row.full_name,
      email: row.email,
      phoneNumber: row.phone_number,
      gender: row.gender,
      dob: row.dob,
      userCode: row.user_code,
    }));

    console.log("✅ Patients found:", formatted);
    res.json(formatted);
  } catch (error) {
    console.error("❌ Error searching patients:", error);
    res.status(500).json({ message: "Server error during patient search" });
  }
};


