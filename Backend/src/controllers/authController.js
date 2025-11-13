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
// Register user on blockchain
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

    // Fetch user from DB to check role
    const { rows: users } = await query(
      "SELECT * FROM users WHERE LOWER(wallet_address)=$1 AND LOWER(email)=$2 AND isverified=true AND is_deleted = false",
      [walletAddress.toLowerCase(), email.toLowerCase()]
    );
    if (!users.length) {
      return res.status(404).json({ success: false, error: 'User not found or not verified' });
    }
    const user = users[0];
    // If admin, bypass on-chain status check
    if (user.role && user.role.toLowerCase() === 'admin') {
      console.log('🔓 Admin login: bypassing on-chain status check');
    } else {
      // Check on-chain status before sending OTP
      const { getUserOnChain } = await import('../services/blockchainService.js');
      let onChainUser;
      try {
        onChainUser = await getUserOnChain(walletAddress);
      } catch (err) {
        console.error('Blockchain status check failed:', err);
        return res.status(500).json({ success: false, error: 'Blockchain status check failed' });
      }
      // Status: 0=Pending, 1=Active, 2=Suspended, 3=Inactive
      if (!onChainUser || onChainUser.status !== 1) {
        let statusMsg = 'Your account status is not active.';
        switch (onChainUser?.status) {
          case 0: statusMsg = 'Your account is pending approval.'; break;
          case 2: statusMsg = 'Your account is suspended.'; break;
          case 3: statusMsg = 'Your account is inactive.'; break;
        }
        return res.status(403).json({ success: false, error: statusMsg });
      }
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

    // Fetch user from DB to check role
    const { rows: users } = await query(
      "SELECT * FROM users WHERE LOWER(wallet_address)=$1 AND is_deleted = false",
      [result.walletAddress.toLowerCase()]
    );
    const user = users[0];
    // If admin, bypass on-chain status check
    if (user && user.role && user.role.toLowerCase() === 'admin') {
      console.log('🔓 Admin login: bypassing on-chain status check');
    } else {
      // Check on-chain status before allowing login
      const { getUserOnChain } = await import('../services/blockchainService.js');
      let onChainUser;
      try {
        onChainUser = await getUserOnChain(result.walletAddress);
      } catch (err) {
        console.error('Blockchain status check failed:', err);
        return res.status(500).json({ success: false, error: 'Blockchain status check failed' });
      }
      // Status: 0=Pending, 1=Active, 2=Suspended, 3=Inactive
      if (!onChainUser || onChainUser.status !== 1) {
        let statusMsg = 'Your account status is not active.';
        switch (onChainUser?.status) {
          case 0: statusMsg = 'Your account is pending approval.'; break;
          case 2: statusMsg = 'Your account is suspended.'; break;
          case 3: statusMsg = 'Your account is inactive.'; break;
        }
        return res.status(403).json({ success: false, error: statusMsg });
      }
    }
    // ✅ Generate JWT using the userId from the service result
    const token = generateJwt({
      userId: result.userId,
      role: result.role,
      walletAddress: result.walletAddress,
      email: result.email
    });

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

    res.json(responseData);

  } catch (err) {
    console.error("\n❌ ========== LOGIN VERIFY OTP ERROR ==========");
    console.error("Error:", {
      message: err.message,
      status: err.status,
      stack: err.stack
    });
    console.error("❌ ==========================================");
    res.status(err.status || 500).json({
      success: false,
      error: err.message || "Failed to verify login OTP",
    });
  }

}

// =======================================================
// Dropdown endpoints for registration
// =======================================================

// Hospital dropdown
export async function getHospitalList(req, res) {
  try {
    const { rows } = await query(
      'SELECT id, name, facility_address FROM hospital ORDER BY name'
    );
    res.json(rows);
  } catch (err) {
    console.error('❌ Hospital list fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch hospital list' });
  }
}

// Pharmacy company dropdown
export async function getPharmacyCompanyList(req, res) {
  try {
    const { rows } = await query(
      'SELECT id, name, facility_address FROM pharmacy_company ORDER BY name'
    );
    res.json(rows);
  } catch (err) {
    console.error('❌ Pharmacy company list fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch pharmacy company list' });
  }
}

// Distributor company dropdown
export async function getDistributorCompanyList(req, res) {
  try {
    const { rows } = await query(
      'SELECT id, name, facility_address FROM distributor_company ORDER BY name'
    );
    res.json(rows);
  } catch (err) {
    console.error('❌ Distributor company list fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch distributor company list' });
  }
}

// Manufacturer company dropdown
export async function getManufacturerCompanyList(req, res) {
  try {
    const { rows } = await query(
      'SELECT id, name, facility_address FROM manufacturer_company ORDER BY name'
    );
    res.json(rows);
  } catch (err) {
    console.error('❌ Manufacturer company list fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch manufacturer company list' });
  }
}

// Regulator company dropdown
export async function getRegulatorCompanyList(req, res) {
  try {
    const { rows } = await query(
      'SELECT id, name, facility_address FROM regulator_company ORDER BY name'
    );
    res.json(rows);
  } catch (err) {
    console.error('❌ Regulator company list fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch regulator company list' });
  }
}
