import express from "express";
import { getPatientProfile, updatePatientProfile } from "../controllers/patientController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(authMiddleware, roleMiddleware(["PATIENT"]));

router.get("/profile", getPatientProfile);
router.put("/profile", updatePatientProfile);

export default router;
