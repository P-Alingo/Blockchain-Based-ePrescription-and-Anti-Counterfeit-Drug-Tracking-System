import express from "express";
import {
  createPrescription,
  getPrescription,
  listPrescriptions,
  deletePrescription,
} from "../controllers/prescriptionController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/", roleMiddleware(["DOCTOR"]), createPrescription);
router.get("/", roleMiddleware(["ADMIN", "DOCTOR", "PHARMACIST", "PATIENT"]), listPrescriptions);
router.get("/:id", roleMiddleware(["ADMIN", "DOCTOR", "PHARMACIST", "PATIENT"]), getPrescription);
router.delete("/:id", roleMiddleware(["ADMIN"]), deletePrescription);

export default router;
