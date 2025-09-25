import express from "express";
import * as prescriptionController from "../controllers/prescriptionController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import ROLES from "../config/roles.js";

const router = express.Router();

router.post("/", authMiddleware, roleMiddleware([ROLES.DOCTOR]), prescriptionController.createPrescription);
router.get("/:id", authMiddleware, prescriptionController.getPrescriptionById);
router.get("/user/:userId", authMiddleware, prescriptionController.listPrescriptionsByUser);
router.post("/verify-qr", prescriptionController.verifyPrescriptionQRCode);
router.post("/:id/revoke", authMiddleware, roleMiddleware([ROLES.DOCTOR]), prescriptionController.revokePrescription);

export default router;
