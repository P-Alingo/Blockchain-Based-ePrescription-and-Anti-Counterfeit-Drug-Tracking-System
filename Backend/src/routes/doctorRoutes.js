import express from "express";
import { getDoctorProfile, updateDoctorProfile } from "../controllers/doctorController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(authMiddleware, roleMiddleware(["DOCTOR"]));

router.get("/profile", getDoctorProfile);
router.put("/profile", updateDoctorProfile);

export default router;
