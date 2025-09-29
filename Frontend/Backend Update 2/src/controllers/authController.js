import * as authService from "../services/authService.js";
import * as emailService from "../services/emailService.js";

async function register(req, res, next) {
  try {
    const { email, password, role } = req.body;
    const user = await authService.registerUser(email, password, role);
    res.status(201).json({ message: "User registered", userId: user.id });
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await authService.validateUserCredentials(email, password);
    if (!user) return res.status(401).json({ message: "Invalid email or password" });
    const otpCode = await authService.generateOtpForUser(user.id);
    await emailService.sendOtpEmail(user.email, otpCode);
    res.status(200).json({ message: "OTP sent to email" });
  } catch (error) {
    next(error);
  }
}

async function verifyOtp(req, res, next) {
  try {
    const { email, code } = req.body;
    const token = await authService.verifyOtpAndGenerateJwt(email, code);
    if (!token) return res.status(401).json({ message: "Invalid or expired OTP" });
    res.status(200).json({ token });
  } catch (error) {
    next(error);
  }
}

export { register, login, verifyOtp };
