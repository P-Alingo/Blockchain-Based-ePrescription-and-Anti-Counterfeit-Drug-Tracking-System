import express from "express";
import { getDistributorProfile, updateDistributorProfile } from "../controllers/distributorController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/profile", getDistributorProfile);
router.put("/profile", updateDistributorProfile);

export default router;
