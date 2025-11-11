

import express from "express";
import {
	getDashboard,
	getReports,
	getAnalytics,
	getBlockchainLogs,
	updateSettings,
	listTables,
	getTableData,
	addTableRow,
	updateTableRow,
	deleteTableRow,
	searchAuditLogs
} from "../controllers/adminController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
// Audit log search/filter endpoint

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

// Database management
router.get("/database/list", listTables);
router.get("/database/:table", getTableData);
router.post("/database/:table", addTableRow);
router.put("/database/:table/:id", updateTableRow);

// Audit log search/filter endpoint
router.get("/audit-logs/search", searchAuditLogs);
router.delete("/database/:table/:id", deleteTableRow);

export default router;
