import express from "express";
import { getGlobalAnalytics, getAnalyticsByRole, generateCustomAnalytics } from "../controllers/analyticsController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();
router.use(authMiddleware);

router.get("/global", getGlobalAnalytics);
router.get("/:role", getAnalyticsByRole);
router.post("/custom", generateCustomAnalytics);

export default router;
