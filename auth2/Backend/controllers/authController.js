import { generateOtp } from '../utils/otpGenerator.js';
import { sendOtpEmail } from '../utils/emailSender.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { query } from '../db.js';

const otpExpirationMinutes = parseInt(process.env.OTP_EXPIRATION_MINUTES) || 10;
const jwtSecret = process.env.JWT_SECRET;

// --- CHECK USER EXISTS ---
export async function checkUser(req, res) {
  try {
    const { walletAddress, email } = req.body;
    
    let queryText;
    let params;

    if (walletAddress) {
      queryText = "SELECT * FROM users WHERE wallet_address=$1";
      params = [walletAddress];
    } else if (email) {
      queryText = "SELECT * FROM users WHERE email=$1";
      params = [email];
    } else {
      return res.status(400).json({ error: "Wallet address or email required" });
    }

    const result = await query(queryText, params);
    res.json({ exists: result.rows.length > 0 });
  } catch (error) {
    console.error('checkUser error:', error);
    res.status(500).json({ error: 'Failed to check user' });
  }
}

// --- REGISTER (Request OTP) ---
export async function registerRequestOtp(req, res) {
  try {
    const { address, email, role } = req.body;
    if (!address || !email || !role) {
      return res.status(400).json({ error: 'Wallet, email and role are required' });
    }

    // Check if already registered
    const existing = await query(
      'SELECT * FROM users WHERE LOWER(wallet_address)=$1 OR LOWER(email)=$2',
      [address.toLowerCase(), email.toLowerCase()]
    );
    if (existing.rowCount > 0) {
      return res.status(400).json({ error: 'Wallet or email already registered' });
    }

    // Generate and hash OTP
    const otp = generateOtp();
    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
    const expiresAt = new Date(Date.now() + otpExpirationMinutes * 60 * 1000);

    // Save OTP
    await query(
      'INSERT INTO otps (wallet_address, email, otp_hash, expires_at, is_register) VALUES ($1,$2,$3,$4,$5)',
      [address.toLowerCase(), email.toLowerCase(), otpHash, expiresAt, true]
    );

    await sendOtpEmail(email, otp);
    res.json({ message: 'OTP sent to email for registration' });

  } catch (error) {
    console.error('registerRequestOtp error:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
}

// --- LOGIN (Request OTP) ---
export async function loginRequestOtp(req, res) {
  try {
    const { address, email } = req.body;
    if (!address || !email) {
      return res.status(400).json({ error: 'Wallet and email are required' });
    }

    // Check user exists
    const userCheck = await query(
      'SELECT * FROM users WHERE LOWER(wallet_address)=$1 AND LOWER(email)=$2',
      [address.toLowerCase(), email.toLowerCase()]
    );
    if (userCheck.rowCount === 0) {
      return res.status(400).json({ error: 'User not found' });
    }

    const otp = generateOtp();
    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
    const expiresAt = new Date(Date.now() + otpExpirationMinutes * 60 * 1000);

    await query(
      'INSERT INTO otps (wallet_address, email, otp_hash, expires_at, is_register) VALUES ($1,$2,$3,$4,$5)',
      [address.toLowerCase(), email.toLowerCase(), otpHash, expiresAt, false]
    );

    await sendOtpEmail(email, otp);
    res.json({ message: 'OTP sent to email for login' });

  } catch (error) {
    console.error('loginRequestOtp error:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
}

// --- VERIFY OTP ---
export async function verifyOtp(req, res) {
  try {
    const { address, otp } = req.body;
    if (!address || !otp) {
      return res.status(400).json({ error: 'Wallet and OTP required' });
    }

    // Get the most recent OTP for this wallet
    const otpRes = await query(
      'SELECT * FROM otps WHERE LOWER(wallet_address)=$1 ORDER BY created_at DESC LIMIT 1',
      [address.toLowerCase()]
    );
    if (otpRes.rowCount === 0) {
      return res.status(400).json({ error: 'No OTP found for this address' });
    }

    const otpRow = otpRes.rows[0];
    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");

    // Validate OTP
    if (otpHash !== otpRow.otp_hash) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }
    if (new Date(otpRow.expires_at) < new Date()) {
      return res.status(400).json({ error: 'OTP expired' });
    }

    // If it's registration, create the user
    if (otpRow.is_register) {
      await query(
        'INSERT INTO users (wallet_address, email, role) VALUES ($1,$2,$3)',
        [otpRow.wallet_address, otpRow.email, 'Patient'] // You might want to store role during registration
      );
    }

    // Generate JWT
    const token = jwt.sign(
      { walletAddress: otpRow.wallet_address, email: otpRow.email },
      jwtSecret,
      { expiresIn: '1h' }
    );

    res.json({ message: 'OTP verified', token, email: otpRow.email });

  } catch (error) {
    console.error('verifyOtp error:', error);
    res.status(500).json({ error: 'Failed to verify OTP' });
  }
}