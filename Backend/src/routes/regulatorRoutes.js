import express from "express";
import * as regulatorController from "../controllers/regulatorController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import ROLES from "../config/roles.js";

const router = express.Router();

router.use(authMiddleware);
router.use(roleMiddleware([ROLES.REGULATOR]));

router.get("/audit-logs", regulatorController.getAuditLogs);
router.get("/supply-chain-status", regulatorController.monitorSupplyChain);
router.post("/enforce-compliance", regulatorController.enforceCompliance);
router.post("/revoke-access", regulatorController.revokeAccess);

export default router;
