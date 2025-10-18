import express from "express";
import {
  createPrescription,
  getPrescription,
  listPrescriptions,
  deletePrescription,
  searchPatients,
  searchDrugs,
} from "../controllers/prescriptionController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

// CRUD
router.post("/", createPrescription);
router.get("/", listPrescriptions);
router.get("/:id", getPrescription);
router.delete("/:id", deletePrescription);

// Search
router.get("/search/patient", searchPatients);
router.get("/search/drug", searchDrugs);

export default router;
