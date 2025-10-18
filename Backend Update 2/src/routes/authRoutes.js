// src/routes/authRoutes.js
import express from "express";
import {
  registerRequestOtp,
  verifyOtp,
  loginRequestOtp,
  loginVerifyOtp,
} from "../controllers/authController.js";

const router = express.Router();

// -------------------
// Registration Routes
// -------------------
router.post("/register/request-otp", registerRequestOtp);
router.post("/register/verify-otp", verifyOtp);

// -------------------
// Login Routes
// -------------------
router.post("/login/request-otp", loginRequestOtp);
router.post("/login/verify-otp", loginVerifyOtp);

export default router;