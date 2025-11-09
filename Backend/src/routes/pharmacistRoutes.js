import { confirmPharmacistDelivery } from "../controllers/pharmacistController.js";
import express from "express";
import {
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
	getPharmacistDrugBatches
} from "../controllers/pharmacistController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";


const router = express.Router();
router.use(authMiddleware);
// Pharmacist confirms delivery of shipment
router.post("/shipments/confirm-delivery", authMiddleware, confirmPharmacistDelivery);

router.get("/profile", getPharmacistProfile);
router.put("/profile", updatePharmacistProfile);

router.get("/dashboard", getPharmacistDashboard);
router.post("/verify", verifyPrescription);
router.post("/dispense", dispenseDrug);

router.get("/prescriptions", getPharmacistPrescriptions);

router.get("/inventory", getPharmacistInventory);
router.post("/inventory", addPharmacistInventory);
router.put("/inventory/:id", updatePharmacistInventory);
router.delete("/inventory/:id", deletePharmacistInventory);

router.get("/requests", getPharmacistRequests);
router.post("/requests", createPharmacistRequest);
router.delete("/requests/:id", deletePharmacistRequest);

router.get("/distributors", getPharmacistDistributors);
router.get("/shipments", getPharmacistShipments);
router.get("/drug-batches", getPharmacistDrugBatches);

router.get("/blockchain", getPharmacistBlockchain);
router.get("/analytics", getPharmacistAnalytics);

export default router;
