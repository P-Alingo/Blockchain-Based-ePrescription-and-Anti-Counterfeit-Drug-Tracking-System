import express from "express";
import { listActivityLogs } from "../controllers/activityLogController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", listActivityLogs);

export default router;
