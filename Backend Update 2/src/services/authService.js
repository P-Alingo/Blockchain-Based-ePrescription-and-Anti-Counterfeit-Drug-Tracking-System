import { prisma } from "../config/database.js";
import { hashPassword, comparePassword } from "../utils/passwordUtils.js";
import { generateJwt, verifyJwt } from "../utils/jwtUtils.js";
import { generateOtp, verifyOtp } from "../utils/otpUtils.js";

async function registerUser(email, password, role) {
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) throw new Error("User already exists");
  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { email, passwordHash, role },
  });
  return user;
}

async function validateUserCredentials(email, password) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return null;
  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) return null;
  return user;
}

async function generateOtpForUser(userId) {
  const code = generateOtp();
  const expiresAt = new Date(Date.now() + Number(process.env.OTP_EXPIRATION_MINUTES) * 60000);
  await prisma.otp.create({
    data: { userId, code, expiresAt },
  });
  return code;
}

async function verifyOtpAndGenerateJwt(email, code) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return null;
  const otpRecords = await prisma.otp.findMany({
    where: { userId: user.id, code },
    orderBy: { expiresAt: "desc" },
  });
  if (otpRecords.length === 0) return null;
  const validOtp = otpRecords.find((otp) => verifyOtp(otp.code, code) && otp.expiresAt > new Date());
  if (!validOtp) return null;
  // Delete used OTPs
  await prisma.otp.deleteMany({ where: { id: { in: otpRecords.map((o) => o.id) } } });
  const token = generateJwt({ userId: user.id, role: user.role });
  return token;
}

export { registerUser, validateUserCredentials, generateOtpForUser, verifyOtpAndGenerateJwt };
