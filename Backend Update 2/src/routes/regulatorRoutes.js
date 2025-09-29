import express from "express";
import { getRegulatorProfile, updateRegulatorProfile } from "../controllers/regulatorController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(authMiddleware, roleMiddleware(["REGULATOR"]));

router.get("/profile", getRegulatorProfile);
router.put("/profile", updateRegulatorProfile);

export default router;
