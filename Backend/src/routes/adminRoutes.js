
import express from "express";
import {
	getDashboard,
	getReports,
	getAnalytics,
	getBlockchainLogs,
	updateSettings
} from "../controllers/adminController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();
router.use(authMiddleware);

// Dashboard
router.get("/dashboard", getDashboard);

// Reports
router.get("/reports", getReports);

// Analytics
router.get("/analytics", getAnalytics);

// Blockchain logs
router.get("/blockchain", getBlockchainLogs);

// System settings update
router.put("/settings", updateSettings);

export default router;
