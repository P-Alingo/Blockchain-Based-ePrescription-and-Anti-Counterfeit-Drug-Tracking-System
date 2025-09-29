import express from "express";
import { register, login, verifyOtp } from "../controllers/authController.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { registerSchema, loginSchema, verifyOtpSchema } from "../utils/validator.js";

const router = express.Router();

router.post("/register", validateRequest(registerSchema), register);
router.post("/login", validateRequest(loginSchema), login);
router.post("/verify-otp", validateRequest(verifyOtpSchema), verifyOtp);

export default router;
