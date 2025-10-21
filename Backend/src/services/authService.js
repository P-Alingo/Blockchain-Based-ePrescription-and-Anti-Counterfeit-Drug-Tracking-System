
// authService.js

import crypto from "crypto";
import { query } from "../config/database.js";
import { generateOtp } from "../utils/otpGenerator.js";
import { sendOtpEmail } from "../utils/emailSender.js";

const OTP_EXPIRATION_MINUTES = Number(process.env.OTP_EXPIRATION_MINUTES) || 2;

// ===============================================================
// 1️⃣ REGISTER - REQUEST OTP
// ===============================================================
export async function registerRequestOtpService({
  walletAddress,
  email,
  role,
  full_name,
  phone_number,
  dob,
  gender,
  specialization,
  licenseno,
  hospital,
  pharmacy,
  companyname,
  organizationname,
}) {
  if (!walletAddress || !email || !role)
    throw { status: 400, message: "Wallet, email, and role are required" };

  const wallet = walletAddress.toLowerCase();
  const mail = email.toLowerCase();

  console.log(`🟡 Registration request: ${mail} (${wallet}) as ${role}`);

  // ✅ Check if wallet/email already exist
  const { rows: existingUsers } = await query(
    `SELECT * FROM users WHERE LOWER(wallet_address) = $1 OR LOWER(email) = $2`,
    [wallet, mail]
  );

  if (existingUsers.length > 0) {
    const existing = existingUsers[0];

    // Already verified → block new registration
    if (existing.isverified) {
      throw {
        status: 409,
        message:
          "This email or wallet address is already registered and verified. Please log in instead.",
      };
    }

    // Not yet verified → resend OTP, do NOT insert new user
    console.log("♻️ Existing unverified user – resending OTP");

    const otp = generateOtp();
    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
    const expiresAt = new Date(Date.now() + OTP_EXPIRATION_MINUTES * 60 * 1000);

    await query(
      "INSERT INTO otps (user_id, otp_hash, expires_at, created_at) VALUES ($1,$2,$3,NOW())",
      [existing.id, otpHash, expiresAt]
    );

    await sendOtpEmail(existing.email, otp);
    console.log(`📨 OTP resent to ${existing.email}`);

    return {
      message:
        "An existing unverified account was found. OTP has been resent to your email.",
    };
  }

  // ✅ No conflict – create new unverified user
  const { rows } = await query(
    `INSERT INTO users 
      (wallet_address, email, role, full_name, phone_number, dob, gender, isverified, createdat, updatedat)
     VALUES ($1,$2,$3,$4,$5,$6,$7,false,NOW(),NOW())
     RETURNING id, email`,
    [wallet, mail, role, full_name || "", phone_number || "", dob || null, gender || ""]
  );

  const userId = rows[0].id;
  console.log(`✅ Created new user ID: ${userId}`);

  // Generate user_code based on role
  const rolePrefixes = {
    patient: "P",
    doctor: "D",
    pharmacist: "PH",
    distributor: "DIS",
    manufacturer: "M",
    regulator: "R",
    admin: "A",
  };

  const prefix = rolePrefixes[role.toLowerCase()] || "U";

  const { rows: countRows } = await query(
    "SELECT COUNT(*) AS count FROM users WHERE role = $1",
    [role]
  );
  const count = parseInt(countRows[0].count);

  const userCode = `${prefix}${count.toString().padStart(3, "0")}`;

  await query("UPDATE users SET user_code=$1 WHERE id=$2", [userCode, userId]);

  console.log(`🔢 Assigned user_code: ${userCode}`);

  // ✅ Insert role-specific data
  try {
    switch (role.toLowerCase()) {
      case "doctor":
        await query(
          `INSERT INTO doctor (userid, specialization, licenseno, hospital)
           VALUES ($1,$2,$3,$4)
           ON CONFLICT (userid) DO UPDATE SET specialization=$2, licenseno=$3, hospital=$4`,
          [userId, specialization, licenseno, hospital]
        );
        break;

      case "pharmacist":
        await query(
          `INSERT INTO pharmacist (userid, licenseno, pharmacy)
           VALUES ($1,$2,$3)
           ON CONFLICT (userid) DO UPDATE SET licenseno=$2, pharmacy=$3`,
          [userId, licenseno, pharmacy]
        );
        break;

      case "regulator":
        await query(
          `INSERT INTO regulator (userid, organizationname)
           VALUES ($1,$2)
           ON CONFLICT (userid) DO UPDATE SET organizationname=$2`,
          [userId, organizationname]
        );
        break;

      case "patient":
        await query(
          `INSERT INTO patient (userid, dateofbirth)
           VALUES ($1,$2)
           ON CONFLICT (userid) DO UPDATE SET dateofbirth=$2`,
          [userId, dob]
        );
        break;

      case "admin":
        await query(
          `INSERT INTO admin (userid)
           VALUES ($1)
           ON CONFLICT (userid) DO NOTHING`,
          [userId]
        );
        break;

      case "manufacturer":
        await query(
          `INSERT INTO manufacturer (userid, companyname, licenseno)
           VALUES ($1,$2,$3)
           ON CONFLICT (userid) DO UPDATE SET companyname=$2, licenseno=$3`,
          [userId, companyname, licenseno]
        );
        break;

      case "distributor":
        await query(
          `INSERT INTO distributor (userid, companyname, licenseno)
           VALUES ($1,$2,$3)
           ON CONFLICT (userid) DO UPDATE SET companyname=$2, licenseno=$3`,
          [userId, companyname, licenseno]
        );
        break;
    }
  } catch (err) {
    console.error("❌ Role table update failed:", err.message);
    throw { status: 500, message: "Failed to save role-specific data" };
  }

  // ✅ OTP generation + email
  const otp = generateOtp();
  const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
  const expiresAt = new Date(Date.now() + OTP_EXPIRATION_MINUTES * 60 * 1000);

  await query(
    "INSERT INTO otps (user_id, otp_hash, expires_at, created_at) VALUES ($1,$2,$3,NOW())",
    [userId, otpHash, expiresAt]
  );

  await sendOtpEmail(email, otp);
  console.log(`📨 OTP sent to ${email}`);
  return { message: "OTP sent to your email for verification" };
}
// ===============================================================
// 2️⃣ VERIFY REGISTRATION OTP - FIXED
// ===============================================================
export async function verifyOtpService({ walletAddress, otp }) {
  if (!walletAddress || !otp)
    throw { status: 400, message: "Wallet and OTP required" };

  const wallet = walletAddress.toLowerCase();
  const { rows: users } = await query(
    "SELECT * FROM users WHERE LOWER(wallet_address)=$1",
    [wallet]
  );

  if (users.length === 0)
    throw { status: 404, message: "User not found. Please register first." };

  const user = users[0];
  if (user.isverified)
    throw { status: 400, message: "User already verified. Please log in." };

  const { rows: otps } = await query(
    "SELECT * FROM otps WHERE user_id=$1 AND used_at IS NULL ORDER BY created_at DESC LIMIT 1",
    [user.id]
  );

  if (otps.length === 0) throw { status: 400, message: "No OTP found" };

  const otpRow = otps[0];
  const providedHash = crypto.createHash("sha256").update(otp).digest("hex");

  if (providedHash !== otpRow.otp_hash)
    throw { status: 400, message: "Invalid OTP" };

  if (new Date(otpRow.expires_at) < new Date())
    throw { status: 400, message: "OTP expired" };

  await query("UPDATE otps SET used_at=NOW() WHERE id=$1", [otpRow.id]);
  await query("UPDATE users SET isverified=true, updatedat=NOW() WHERE id=$1", [
    user.id,
  ]);

  console.log(`✅ Verified user ${user.email}`);
  
  // ✅ RETURN userId for controller to use
  return { 
    message: "Registration verified successfully.",
    userId: user.id
  };
}

// ===============================================================
// 3️⃣ LOGIN - REQUEST OTP
// ===============================================================
export async function loginRequestOtpService({ walletAddress, email }) {
  if (!walletAddress || !email)
    throw { status: 400, message: "Wallet and email are required" };

  const wallet = walletAddress.toLowerCase();
  const mail = email.toLowerCase();

  const userRes = await query(
    "SELECT * FROM users WHERE LOWER(wallet_address)=$1 AND LOWER(email)=$2 AND isverified=true",
    [wallet, mail]
  );

  if (userRes.rowCount === 0)
    throw {
      status: 400,
      message:
        "No verified user found with that wallet and email. Please register first.",
    };

  const user = userRes.rows[0];
  const otp = generateOtp();
  const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
  const expiresAt = new Date(Date.now() + OTP_EXPIRATION_MINUTES * 60 * 1000);

  await query(
    "INSERT INTO otps (user_id, otp_hash, expires_at, created_at) VALUES ($1,$2,$3,NOW())",
    [user.id, otpHash, expiresAt]
  );

  await sendOtpEmail(email, otp);
  console.log(`📨 Login OTP sent to ${email}`);

  return { message: "Login OTP sent" };
}

// ===============================================================
// 4️⃣ LOGIN - VERIFY OTP - FIXED
// ===============================================================
export async function loginVerifyOtpService({ walletAddress, email, otp }) {
  if (!walletAddress || !email || !otp)
    throw { status: 400, message: "Wallet, email, and OTP required" };

  const wallet = walletAddress.toLowerCase();
  const mail = email.toLowerCase();

  const { rows: users } = await query(
    "SELECT * FROM users WHERE LOWER(wallet_address)=$1 AND LOWER(email)=$2 AND isverified=true",
    [wallet, mail]
  );

  if (users.length === 0)
    throw { status: 404, message: "User not found or not verified" };

  const user = users[0];
  
  const { rows: otps } = await query(
    "SELECT * FROM otps WHERE user_id=$1 AND used_at IS NULL ORDER BY created_at DESC LIMIT 1",
    [user.id]
  );

  if (otps.length === 0)
    throw { status: 400, message: "No OTP found for this user" };

  const otpRow = otps[0];
  const providedHash = crypto.createHash("sha256").update(otp).digest("hex");

  if (providedHash !== otpRow.otp_hash)
    throw { status: 400, message: "Invalid OTP" };

  if (new Date(otpRow.expires_at) < new Date())
    throw { status: 400, message: "OTP expired" };

  await query("UPDATE otps SET used_at=NOW() WHERE id=$1", [otpRow.id]);
  console.log(`✅ Login successful for ${email}`);

  // ✅ RETURN ALL REQUIRED DATA
  return {
    message: "Login successful",
    userId: user.id,
    role: user.role,
    email: user.email,
    walletAddress: user.wallet_address,
    fullName: user.full_name,
    userCode: user.user_code
  };
}