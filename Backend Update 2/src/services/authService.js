// authService.js
import crypto from 'crypto';
import { query } from '../config/database.js';
import { generateOtp } from '../utils/otpGenerator.js';
import { sendOtpEmail } from '../utils/emailSender.js';

const OTP_EXPIRATION_MINUTES = Number(process.env.OTP_EXPIRATION_MINUTES) || 2;

// -----------------------------
// Registration Services
// -----------------------------
export async function registerRequestOtpService({
  walletAddress,
  email,
  role,
  fullName,
  phoneNumber,
  dob,
  gender,
}) {
  if (!walletAddress || !email || !role) {
    throw { status: 400, message: 'Wallet, email, and role are required' };
  }

  const existingUser = await query(
    'SELECT * FROM users WHERE LOWER(wallet_address)=$1 OR LOWER(email)=$2',
    [walletAddress.toLowerCase(), email.toLowerCase()]
  );

  let userId;

  if (existingUser.rowCount === 0) {
    // Create new user
    const newUser = await query(
      `INSERT INTO users
        (wallet_address, email, role, full_name, phone_number, dob, gender, isverified, createdat, updatedat)
       VALUES ($1,$2,$3,$4,$5,$6,$7,false,NOW(),NOW())
       RETURNING id`,
      [
        walletAddress.toLowerCase(),
        email.toLowerCase(),
        role,
        fullName || '',
        phoneNumber || '',
        dob || null,
        gender || '',
      ]
    );
    userId = newUser.rows[0].id;
  } else {
    // Existing user: update missing details
    const user = existingUser.rows[0];
    userId = user.id;
    await query(
      `UPDATE users SET
        full_name=$1,
        phone_number=$2,
        dob=$3,
        gender=$4,
        updatedat=NOW()
       WHERE id=$5`,
      [
        fullName || user.full_name,
        phoneNumber || user.phone_number,
        dob || user.dob,
        gender || user.gender,
        userId,
      ]
    );
  }

  // Generate OTP
  const otp = generateOtp();
  const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
  const expiresAt = new Date(Date.now() + OTP_EXPIRATION_MINUTES * 60 * 1000);

  // Store OTP
  await query(
    'INSERT INTO otps (user_id, otp_hash, expires_at, created_at) VALUES ($1,$2,$3,NOW())',
    [userId, otpHash, expiresAt]
  );

  // Send OTP email
  await sendOtpEmail(email, otp);

  return { message: 'OTP sent to your email for registration' };
}

export async function verifyOtpService({ walletAddress, otp }) {
  if (!walletAddress || !otp) {
    throw { status: 400, message: 'Wallet and OTP are required' };
  }

  // Fetch user
  const userRes = await query(
    'SELECT * FROM users WHERE LOWER(wallet_address)=$1',
    [walletAddress.toLowerCase()]
  );
  if (userRes.rowCount === 0) throw { status: 400, message: 'User not found' };
  const user = userRes.rows[0];

  // Fetch latest unused OTP
  const otpRes = await query(
    'SELECT * FROM otps WHERE user_id=$1 AND used_at IS NULL ORDER BY created_at DESC LIMIT 1',
    [user.id]
  );
  if (otpRes.rowCount === 0) throw { status: 400, message: 'No OTP found for this user' };

  const otpRow = otpRes.rows[0];
  const providedOtpHash = crypto.createHash('sha256').update(otp).digest('hex');

  if (providedOtpHash !== otpRow.otp_hash) throw { status: 400, message: 'Invalid OTP' };
  if (new Date(otpRow.expires_at) < new Date()) throw { status: 400, message: 'OTP expired' };

  // Mark OTP as used
  await query('UPDATE otps SET used_at=NOW() WHERE id=$1', [otpRow.id]);

  // Mark user verified
  await query('UPDATE users SET isverified=true, updatedat=NOW() WHERE id=$1', [user.id]);

  return {
    message: '✅ OTP verified, user registered successfully',
    userId: user.id,
    role: user.role,
    email: user.email,
  };
}

// -----------------------------
// Login Services
// -----------------------------
export async function loginRequestOtpService({ walletAddress, email }) {
  if (!walletAddress || !email) {
    throw { status: 400, message: 'Wallet and email are required' };
  }

  // Check verified user
  const userRes = await query(
    'SELECT * FROM users WHERE LOWER(wallet_address)=$1 AND LOWER(email)=$2 AND isverified=true',
    [walletAddress.toLowerCase(), email.toLowerCase()]
  );
  if (userRes.rowCount === 0) {
    throw { status: 400, message: 'User not registered or not verified' };
  }

  const user = userRes.rows[0];

  // Generate login OTP
  const otp = generateOtp();
  const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
  const expiresAt = new Date(Date.now() + OTP_EXPIRATION_MINUTES * 60 * 1000);

  // Store OTP
  await query(
    'INSERT INTO otps (user_id, otp_hash, expires_at, created_at) VALUES ($1,$2,$3,NOW())',
    [user.id, otpHash, expiresAt]
  );

  // Send OTP
  try {
    await sendOtpEmail(email, otp);
  } catch (err) {
    console.error('Login OTP email failed:', err.response?.data || err.message);
    throw { status: 500, message: 'Failed to send OTP email' };
  }

  return { message: 'OTP sent to your email for login', userId: user.id, email: user.email, role: user.role };
}

export async function loginVerifyOtpService({ walletAddress, email, otp }) {
  if (!walletAddress || !email || !otp) {
    throw { status: 400, message: 'Wallet, email, and OTP are required' };
  }

  // Fetch verified user
  const userRes = await query(
    'SELECT * FROM users WHERE LOWER(wallet_address)=$1 AND LOWER(email)=$2 AND isverified=true',
    [walletAddress.toLowerCase(), email.toLowerCase()]
  );
  if (userRes.rowCount === 0) throw { status: 400, message: 'User not registered or not verified' };

  const user = userRes.rows[0];

  // Fetch latest unused OTP
  const otpRes = await query(
    'SELECT * FROM otps WHERE user_id=$1 AND used_at IS NULL ORDER BY created_at DESC LIMIT 1',
    [user.id]
  );
  if (otpRes.rowCount === 0) throw { status: 400, message: 'No OTP found for this user' };

  const otpRow = otpRes.rows[0];
  const providedOtpHash = crypto.createHash('sha256').update(otp).digest('hex');

  if (providedOtpHash !== otpRow.otp_hash) throw { status: 400, message: 'Invalid OTP' };
  if (new Date(otpRow.expires_at) < new Date()) throw { status: 400, message: 'OTP expired' };

  // Mark OTP used
  await query('UPDATE otps SET used_at=NOW() WHERE id=$1', [otpRow.id]);

  return { message: '✅ OTP verified, login successful', userId: user.id, role: user.role, email: user.email };
}
