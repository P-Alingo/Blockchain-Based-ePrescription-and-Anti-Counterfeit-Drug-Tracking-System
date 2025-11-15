import express from "express";
import {
	// Original Admin Functions
	getDashboard,
	getReports,
	getAnalytics,
	updateSettings,
	listTables,
	getTableData,
	addTableRow,
	updateTableRow,
	deleteTableRow,
	searchAuditLogs,
	
	// User Management Functions (merged from userManagementController)
	getAllUsers,
	getUserById,
	searchUsers,
	addUser,
	updateUser,
	deleteUser,
	syncUserToBlockchain,
	restoreUser,
	getDeletedUsers,
	getUserBlockchainStatus,
	
	// Health Check Functions
	healthCheck,
	blockchainHealth,
	
	// Blockchain Event Functions
	getEventListenerStatus,
	startEventListeners,
	stopEventListeners,
	getPastEvents
	
} from "../controllers/adminController.js";
import { blockchainUserStatus, blockchainSyncUser } from "../controllers/blockchainController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// Apply authentication to all routes
router.use(authMiddleware);

// ===========================
// DASHBOARD & ANALYTICS ROUTES
// ===========================

// Dashboard
router.get("/dashboard", getDashboard);

// Reports
router.get("/reports", getReports);

// Analytics
router.get("/analytics", getAnalytics);

// System settings update
router.put("/settings", updateSettings);

// ===========================
// USER MANAGEMENT ROUTES (merged from userManagementRoutes)
// ===========================

// Search users (must come before '/:id' to avoid route conflicts)
router.get("/users/search", searchUsers);

// Get all users
router.get("/users", getAllUsers);

// Get deleted users (admin only)
router.get("/users/deleted", getDeletedUsers);

// Get single user by ID
router.get("/users/:id", getUserById);

// Add new user
router.post("/users", addUser);

// Update user by ID
router.put("/users/:id", updateUser);

// Delete user by ID (soft delete)
router.delete("/users/:id", deleteUser);

// Restore soft-deleted user
router.patch("/users/:id/restore", restoreUser);

// ===========================
// BLOCKCHAIN ROUTES (Redirect to blockchainController)
// ===========================

// Sync user to blockchain
router.post("/users/:id/sync-blockchain", blockchainSyncUser);

// Get user's blockchain status
router.get("/users/:id/blockchain-status", blockchainUserStatus);

// ===========================
// DATABASE MANAGEMENT ROUTES
// ===========================

// Database management
router.get("/database/list", listTables);
router.get("/database/:table", getTableData);
router.post("/database/:table", addTableRow);
router.put("/database/:table/:id", updateTableRow);
router.delete("/database/:table/:id", deleteTableRow);

// ===========================
// AUDIT & LOGS ROUTES
// ===========================

// Audit log search/filter endpoint
router.get("/audit-logs/search", searchAuditLogs);

// ===========================
// SYSTEM HEALTH ROUTES
// ===========================

// Health check endpoint
router.get("/health", healthCheck);

// Blockchain health check
router.get("/blockchain-health", blockchainHealth);

// ===========================
// BLOCKCHAIN EVENT ROUTES
// ===========================

// Get event listener status
router.get("/blockchain/events/status", getEventListenerStatus);

// Start event listeners
router.post("/blockchain/events/start", startEventListeners);

// Stop event listeners
router.delete("/blockchain/events/stop", stopEventListeners);

// Get past events
router.get("/blockchain/events/history", getPastEvents);

export default router;