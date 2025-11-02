import express from "express";
import { getManufacturerProfile, updateManufacturerProfile } from "../controllers/manufacturerController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/profile", getManufacturerProfile);
router.put("/profile", updateManufacturerProfile);

export default router;
