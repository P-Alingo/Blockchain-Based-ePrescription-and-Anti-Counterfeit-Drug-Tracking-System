// src/routes/authRoutes.js
import express from "express";
import {
  registerRequestOtp,
  verifyOtp,
  loginRequestOtp,
  loginVerifyOtp,
  searchAuthController,
  getPatientDashboard, // ✅ Import the new dashboard controller
} from "../controllers/authController.js";
import { authMiddleware } from "../middleware/authMiddleware.js"; // ✅ Import your middleware

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

// -------------------
// User Search (Protected)
// -------------------
router.get("/search", authMiddleware, searchAuthController);

// -------------------
// Patient Dashboard (Protected)
// -------------------
router.get("/dashboard", authMiddleware, getPatientDashboard);

export default router;
