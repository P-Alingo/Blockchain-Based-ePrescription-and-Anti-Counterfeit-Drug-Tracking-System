import express from "express";
import { blockchainHealth, blockchainEvents, blockchainStats, blockchainEntityEvents, blockchainEntityStatus } from "../controllers/blockchainController.js";
import { blockchainUserStatus, blockchainSyncUser } from "../controllers/blockchainController.js";
import { blockchainEditUser } from "../controllers/blockchainController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { doctorBlockchainHealth, doctorBlockchainEvents } from "../controllers/blockchainController.js";
// Pharmacist blockchain endpoints
import { pharmacistBlockchainEvents } from "../controllers/blockchainController.js";
// Manufacturer blockchain endpoints
import { manufacturerBlockchainEvents } from "../controllers/blockchainController.js";
// Regulator blockchain endpoints
import { regulatorBlockchainEvents } from "../controllers/blockchainController.js";
// Distributor blockchain endpoints
import { distributorBlockchainEvents } from "../controllers/blockchainController.js";

const router = express.Router();
router.use(authMiddleware);

// Health
router.get("/health", blockchainHealth);
// All events
router.get("/events", blockchainEvents);
// Stats
router.get("/stats", blockchainStats);
// Events for entity (user, prescription, batch, shipment)
router.get("/events/:entityType/:entityId", blockchainEntityEvents);
// Status for entity
router.get("/status/:entityType/:entityId", blockchainEntityStatus);
// User blockchain status and sync endpoints (for admin)
router.get("/admin/users/:id/blockchain-status", blockchainUserStatus);
router.post("/admin/users/:id/sync-blockchain", blockchainSyncUser);
// User edit endpoint with event logging
router.put("/admin/users/:id", blockchainEditUser);
// Doctor blockchain health
router.get("/doctor/health", doctorBlockchainHealth);
// Doctor blockchain events for prescriptions
router.get("/doctor/events", doctorBlockchainEvents);
// Pharmacist blockchain events for prescriptions
router.get("/pharmacist/events", pharmacistBlockchainEvents);
// Manufacturer blockchain events for batches
router.get("/manufacturer/events", manufacturerBlockchainEvents);
// Regulator blockchain events for oversight
router.get("/regulator/events", regulatorBlockchainEvents);
// Distributor blockchain events for shipments
router.get("/distributor/events", distributorBlockchainEvents);

export default router;
