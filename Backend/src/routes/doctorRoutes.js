import express from "express";
import { getDoctorProfile, updateDoctorProfile, getDoctorDashboard, createPrescription, listPrescriptions, getPrescription, deletePrescription, searchPatients, searchDrugs, listExpiredPrescriptions, getDoctorAnalytics, updatePrescription } from "../controllers/doctorController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

// Expired prescriptions endpoint
router.get("/prescription/expired", listExpiredPrescriptions);

router.get("/profile", getDoctorProfile);
router.put("/profile", updateDoctorProfile);
router.get("/dashboard", getDoctorDashboard);

// Prescription CRUD and search endpoints
router.post("/prescription", createPrescription);
router.get("/prescription", listPrescriptions);
router.get("/prescription/:id", getPrescription);
router.put("/prescription/:id", updatePrescription);
router.delete("/prescription/:id", deletePrescription);
router.get("/search/patient", searchPatients);
router.get("/search/drug", searchDrugs);

// Analytics endpoint
router.get("/analytics", authMiddleware, getDoctorAnalytics);

export default router;
