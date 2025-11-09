import express from "express";
import { getManufacturerProfile, updateManufacturerProfile, getManufacturerDashboard, getManufacturerBatches, getManufacturerBatchDetails, updateManufacturerBatch, deleteManufacturerBatch, getManufacturerBlockchain, getManufacturerBlockchainTx, getManufacturerAnalytics, getManufacturerShipments, getManufacturerShipmentDetails, createManufacturerShipment, updateManufacturerShipmentStatus, deleteManufacturerShipment, getManufacturerDropdowns,  getBatchesReadyForShipping, getShipmentFormDropdowns, createDrugBatch } from "../controllers/manufacturerController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();
router.use(authMiddleware);
// Batch registration route
router.post("/batches", createDrugBatch);
router.get("/drugbatch/form/dropdowns", getManufacturerDropdowns);

// Dropdowns for shipment creation form
router.get("/shipment/form/dropdowns", getShipmentFormDropdowns);

router.get("/shipments", getManufacturerShipments);
router.get("/shipments/:id", getManufacturerShipmentDetails);
router.get("/batches/ready-for-shipping", getBatchesReadyForShipping);
router.post("/shipments", createManufacturerShipment);
router.put("/shipments/:id", updateManufacturerShipmentStatus);
router.delete("/shipments/:id", deleteManufacturerShipment);
router.get("/analytics", getManufacturerAnalytics);

router.get("/blockchain", getManufacturerBlockchain);
router.get("/blockchain/:tx", getManufacturerBlockchainTx);




router.get("/profile", getManufacturerProfile);
router.put("/profile", updateManufacturerProfile);
router.get("/dashboard", getManufacturerDashboard);

router.get("/batches", getManufacturerBatches);
router.get("/batches/:id", getManufacturerBatchDetails);
router.put("/batches/:id", updateManufacturerBatch);
router.delete("/batches/:id", deleteManufacturerBatch);

export default router;
