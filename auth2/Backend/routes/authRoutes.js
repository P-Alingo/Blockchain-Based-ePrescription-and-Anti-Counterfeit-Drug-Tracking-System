import express from 'express';
import { registerRequestOtp, loginRequestOtp, verifyOtp, checkUser } from '../controllers/authController.js';

const router = express.Router();

// Check if user exists
router.post('/check-user', checkUser);

// Register user + send OTP
router.post('/register', registerRequestOtp);

// Login request OTP
router.post('/login/request-otp', loginRequestOtp);

// Verify OTP
router.post('/verify-otp', verifyOtp);

export default router;