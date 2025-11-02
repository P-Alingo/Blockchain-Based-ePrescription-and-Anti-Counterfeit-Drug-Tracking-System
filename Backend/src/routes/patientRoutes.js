import express from "express";
import { getPatientProfile, updatePatientProfile, getPatientDashboard, getPatientPrescriptions, getSinglePrescription, getPrescriptionQRCode, searchPatientsController, searchPatientPrescriptions, exportPatientPrescriptions, getPatientAnalytics } from "../controllers/patientController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/profile", authMiddleware, getPatientProfile);
router.put("/profile", authMiddleware, updatePatientProfile);

router.get("/dashboard", authMiddleware, getPatientDashboard);
router.get("/prescriptions", authMiddleware, getPatientPrescriptions);
router.get("/prescriptions/:id", authMiddleware, getSinglePrescription);
router.get("/prescriptions/:id/qrcode", authMiddleware, getPrescriptionQRCode);
router.get("/prescriptions/search", authMiddleware, searchPatientPrescriptions);
router.get("/prescriptions/export", authMiddleware, exportPatientPrescriptions);
router.get("/search", authMiddleware, searchPatientsController);

// Analytics endpoint
router.get("/analytics", authMiddleware, getPatientAnalytics);

export default router;
