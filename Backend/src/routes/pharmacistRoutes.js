import express from "express";
import {
    confirmPharmacistDelivery,
    getPharmacistProfile,
    updatePharmacistProfile,
    getPharmacistDashboard,
    verifyPrescription,
    dispenseDrug,
    getPharmacistInventory,
    addPharmacistInventory,
    updatePharmacistInventory,
    deletePharmacistInventory,
    getPharmacistRequests,
    createPharmacistRequest,
    getPharmacistDistributors,
    getPharmacistShipments,
    getPharmacistBlockchain,
    getPharmacistAnalytics,
    getPharmacistPrescriptions,
    deletePharmacistRequest,
    getPharmacistDrugBatches,
    expirePharmacistPrescription,
    updatePharmacistRequest,
    updatePharmacistShipmentStatus,   // <-- make sure this exists in controller
} from "../controllers/pharmacistController.js";

import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// NEW route (now router exists)
router.post(
    "/shipments/update-status",
    updatePharmacistShipmentStatus
);

// Removed: Pharmacist confirms delivery of shipment (use /shipments/update-status instead)

router.get("/profile", getPharmacistProfile);
router.put("/profile", updatePharmacistProfile);

router.get("/dashboard", getPharmacistDashboard);
router.post("/verify", verifyPrescription);
router.post("/dispense", dispenseDrug);

// Expire prescription
router.put("/prescriptions/:id/expire", expirePharmacistPrescription);

router.get("/prescriptions", getPharmacistPrescriptions);

router.get("/inventory", getPharmacistInventory);
router.post("/inventory", addPharmacistInventory);
router.put("/inventory/:id", updatePharmacistInventory);
router.delete("/inventory/:id", deletePharmacistInventory);

router.get("/requests", getPharmacistRequests);
router.post("/requests", createPharmacistRequest);
router.put("/requests/:id", updatePharmacistRequest);
router.delete("/requests/:id", deletePharmacistRequest);

router.get("/distributors", getPharmacistDistributors);
router.get("/shipments", getPharmacistShipments);
router.get("/drug-batches", getPharmacistDrugBatches);

router.get("/blockchain", getPharmacistBlockchain);
router.get("/analytics", getPharmacistAnalytics);

export default router;
