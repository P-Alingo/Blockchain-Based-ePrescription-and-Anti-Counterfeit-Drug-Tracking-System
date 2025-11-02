// src/routes/authRoutes.js
import express from "express";
import {
  registerRequestOtp,
  verifyOtp,
  loginRequestOtp,
  loginVerifyOtp,
  getHospitalList,
  getPharmacyCompanyList,
  getDistributorCompanyList,
  getManufacturerCompanyList,
  getRegulatorCompanyList
} from "../controllers/authController.js";
import { authMiddleware } from "../middleware/authMiddleware.js"; const router = express.Router();

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

// Dropdown endpoints for registration
router.get("/dropdown/hospitals", getHospitalList);
router.get("/dropdown/pharmacy-companies", getPharmacyCompanyList);
router.get("/dropdown/distributor-companies", getDistributorCompanyList);
router.get("/dropdown/manufacturer-companies", getManufacturerCompanyList);
router.get("/dropdown/regulator-companies", getRegulatorCompanyList);



export default router;
