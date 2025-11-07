import express from "express";
import {
	getDistributorProfile,
	updateDistributorProfile,
	getDistributorDashboard,
	getDistributorRequests,
	approveDistributorRequest,
	rejectDistributorRequest,
	getDistributorShipments,
	createDistributorShipment,
	updateDistributorShipmentStatus,
	getDistributorInventory,
	addDistributorInventory,
	getDistributorBlockchain,
	getDistributorAnalytics,
	getDistributorDrugRequests
} from "../controllers/distributorController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/profile", getDistributorProfile);
router.put("/profile", updateDistributorProfile);

// Dashboard
router.get("/dashboard", getDistributorDashboard);

// Requests
router.get("/requests", getDistributorRequests);
router.put("/requests/:id/approve", approveDistributorRequest);
router.put("/requests/:id/reject", rejectDistributorRequest);

// Shipments
router.get("/shipments", getDistributorShipments);
router.post("/shipments", createDistributorShipment);
router.put("/shipments/:id/status", updateDistributorShipmentStatus);

// Inventory
router.get("/inventory", getDistributorInventory);
router.post("/inventory", addDistributorInventory);

// Drug requests dashboard (all drugs, batches, requests)
router.get("/drug-requests", getDistributorDrugRequests);

// Blockchain
router.get("/blockchain", getDistributorBlockchain);

// Analytics
router.get("/analytics", getDistributorAnalytics);

export default router;
