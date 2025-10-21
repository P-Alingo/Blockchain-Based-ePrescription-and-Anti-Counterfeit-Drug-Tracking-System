import express from "express";
import { listAlerts, markAlertRead } from "../controllers/alertController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", listAlerts);
router.put("/:id/read", markAlertRead);

export default router;
