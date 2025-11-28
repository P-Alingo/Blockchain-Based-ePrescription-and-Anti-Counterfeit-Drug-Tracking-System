import express from "express";
import {
    blockchainHealth,
    blockchainEvents,
    blockchainStats,
    blockchainEntityEvents,
    blockchainEntityStatus,
    blockchainUserStatus,
    blockchainSyncUser,
    blockchainEditUser,
    doctorBlockchainHealth,
    doctorBlockchainEvents,
    pharmacistBlockchainEvents,
    manufacturerBlockchainEvents,
    regulatorBlockchainEvents,
    distributorBlockchainEvents,
    blockchainPrescriptionMap,
    blockchainPrescriptionStatus
} from "../controllers/blockchainController.js";

import { authMiddleware } from "../middleware/authMiddleware.js";

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

// User blockchain status & sync
router.get("/admin/users/:id/blockchain-status", blockchainUserStatus);
router.post("/admin/users/:id/sync-blockchain", blockchainSyncUser);

// User edit with blockchain event logging
router.put("/admin/users/:id", blockchainEditUser);

// Doctor
router.get("/doctor/health", doctorBlockchainHealth);
router.get("/doctor/events", doctorBlockchainEvents);

// Pharmacist
router.get("/pharmacist/events", pharmacistBlockchainEvents);

// Manufacturer
router.get("/manufacturer/events", manufacturerBlockchainEvents);

// Regulator
router.get("/regulator/events", regulatorBlockchainEvents);

// Distributor
router.get("/distributor/events", distributorBlockchainEvents);

// Prescription lookups
router.get("/prescription-map/:id", blockchainPrescriptionMap);
router.get("/prescription-status/:id", blockchainPrescriptionStatus);

// Flagged batches
// ...existing code...

export default router;
