import express from "express";
import {
  getDoctorProfile,
  updateDoctorProfile,
  getDoctorDashboard,
  createPrescription,
  listPrescriptions,
  getPrescription,
  deletePrescription,
  searchPatients,
  searchDrugs,
  listExpiredPrescriptions,
  getDoctorAnalytics,
  updatePrescription
} from "../controllers/doctorController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();
router.use(authMiddleware);

// Profile routes
router.get("/profile", getDoctorProfile);
router.put("/profile", updateDoctorProfile);

// Dashboard route
router.get("/dashboard", getDoctorDashboard);

// Prescription CRUD routes
router.post("/prescription", createPrescription);
router.get("/prescription", listPrescriptions);
router.get("/prescription/:id", getPrescription);
router.put("/prescription/:id", updatePrescription);
router.delete("/prescription/:id", deletePrescription);

// Expired prescriptions endpoint
router.get("/prescription/expired", listExpiredPrescriptions);

// Search routes
router.get("/search/patient", searchPatients);
router.get("/search/drug", searchDrugs);

// Blockchain routes are now handled in blockchainRoutes.js

// Analytics endpoint
router.get("/analytics", getDoctorAnalytics);

export default router;