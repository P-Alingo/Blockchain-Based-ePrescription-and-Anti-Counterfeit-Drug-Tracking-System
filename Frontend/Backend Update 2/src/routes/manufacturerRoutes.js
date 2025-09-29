import express from "express";
import { getManufacturerProfile, updateManufacturerProfile } from "../controllers/manufacturerController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(authMiddleware, roleMiddleware(["MANUFACTURER"]));

router.get("/profile", getManufacturerProfile);
router.put("/profile", updateManufacturerProfile);

export default router;
