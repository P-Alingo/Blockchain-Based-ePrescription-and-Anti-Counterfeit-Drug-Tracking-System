import { 
  registerRequestOtpService, 
  verifyOtpService, 
  loginRequestOtpService, 
  loginVerifyOtpService 
} from '../services/authService.js';
import { generateJwt } from '../utils/jwtUtils.js';

// -----------------------------
// Register OTP
// -----------------------------
export async function registerRequestOtp(req, res) {
  try {
    const result = await registerRequestOtpService(req.body);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to send OTP' });
  }
}

// -----------------------------
// Verify OTP (after registration)
// -----------------------------
export async function verifyOtp(req, res) {
  try {
    const result = await verifyOtpService(req.body);

    // Generate JWT
    const token = generateJwt({ userId: result.userId, role: result.role });

    // Role-based dashboard URL
    const role = result.role.toLowerCase();
    const dashboardMap = {
      patient: '/patient/dashboard',
      doctor: '/doctor/dashboard',
      pharmacist: '/pharmacist/dashboard',
      manufacturer: '/manufacturer/dashboard',
      distributor: '/distributor/dashboard',
      regulator: '/regulator/dashboard',
      admin: '/admin/dashboard',
    };
    const dashboardUrl = dashboardMap[role] || '/dashboard';

    res.json({ message: result.message, email: result.email, token, dashboardUrl });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to verify OTP' });
  }
}

// -----------------------------
// Login OTP Request
// -----------------------------
export async function loginRequestOtp(req, res) {
  try {
    const result = await loginRequestOtpService(req.body);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to send login OTP' });
  }
}

// -----------------------------
// Login OTP Verify
// -----------------------------
export async function loginVerifyOtp(req, res) {
  try {
    const result = await loginVerifyOtpService(req.body);

    // Generate JWT
    const token = generateJwt({ userId: result.userId, role: result.role });

    // Role-based dashboard URL
    const role = result.role.toLowerCase();
    const dashboardMap = {
      patient: '/patient/dashboard',
      doctor: '/doctor/dashboard',
      pharmacist: '/pharmacist/dashboard',
      manufacturer: '/manufacturer/dashboard',
      distributor: '/distributor/dashboard',
      regulator: '/regulator/dashboard',
      admin: '/admin/dashboard',
    };
    const dashboardUrl = dashboardMap[role] || '/dashboard';

    res.json({ message: result.message, email: result.email, token, dashboardUrl });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to verify login OTP' });
  }
}
