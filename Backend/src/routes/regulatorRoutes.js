import express from "express";
import {
		getDashboard,
		getAudits,
		createAudit,
		getReports,
		createReport,
		getComplianceActions,
		createComplianceAction,
		getBlockchainData,
		getAnalytics,
		getAuditLog,
		getFlaggedDrugs,
		getShipments,
		getDrugBatches
} from "../controllers/regulatorController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import {
	regulatorSuspendedUsers,
	regulatorActivateUser,
	regulatorManufacturerViolations,
	regulatorToggleManufacturerStatus,
	updateViolatorStatus
} from "../controllers/blockchainController.js";

const router = express.Router();
router.use(authMiddleware);

// Dashboard
router.get("/dashboard", getDashboard);

// Audits
router.get("/audits", getAudits);
router.post("/audits", createAudit);

// Reports
router.get("/reports", getReports);
router.post("/reports", createReport);

// Audit Log
router.get("/auditlog", getAuditLog);

// Flagged Drugs
router.get("/flaggeddrugs", getFlaggedDrugs);

// Shipments and Drug Batches for Traceability
router.get("/shipments", getShipments);
router.get("/drugbatches", getDrugBatches);

// Compliance actions
router.get("/compliance", getComplianceActions);
router.post("/compliance", createComplianceAction);

// Blockchain verification
router.get("/blockchain", getBlockchainData);

// Analytics
router.get("/analytics", getAnalytics);


// Regulator: Flagged batches from shipment table
// ...existing code...
// Regulator: Suspended users
router.get("/suspended-users", regulatorSuspendedUsers);
// Regulator: Activate suspended user
router.post("/activate-user/:id", regulatorActivateUser);
// Regulator: Manufacturer violations
router.get("/manufacturer-violations", regulatorManufacturerViolations);
// Regulator: Toggle manufacturer status
router.post("/toggle-manufacturer-status/:id", regulatorToggleManufacturerStatus);
// Regulator: Update violator status (suspend/activate)
router.patch("/violator/:userid/status", updateViolatorStatus);

export default router;
