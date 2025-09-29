import express from "express";
import { getDistributorProfile, updateDistributorProfile } from "../controllers/distributorController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(authMiddleware, roleMiddleware(["DISTRIBUTOR"]));

router.get("/profile", getDistributorProfile);
router.put("/profile", updateDistributorProfile);

export default router;
