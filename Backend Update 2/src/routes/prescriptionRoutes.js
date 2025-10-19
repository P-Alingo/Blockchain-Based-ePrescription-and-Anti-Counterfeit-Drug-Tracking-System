import express from "express";
import {
  createPrescription,
  getPrescription,
  listPrescriptions,
  deletePrescription,
  searchPatients,
  searchDrugs,
  getRecentPrescriptions,
  getPatientPrescriptions,
} from "../controllers/prescriptionController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// Apply auth middleware globally
router.use(authMiddleware);

// SEARCH routes
router.get("/search/patient", searchPatients);
router.get("/search/drug", searchDrugs);

// Doctor-specific routes
router.get("/doctor/recent-prescriptions", getRecentPrescriptions);

// Patient-specific routes
router.get("/patient", getPatientPrescriptions);

// CRUD routes
router.post("/", createPrescription);
router.get("/", listPrescriptions);
router.get("/:id", getPrescription);
router.delete("/:id", deletePrescription);

export default router;
