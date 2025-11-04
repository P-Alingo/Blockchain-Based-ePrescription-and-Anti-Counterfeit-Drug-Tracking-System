import express from "express";
import { getManufacturerProfile, updateManufacturerProfile, getManufacturerDashboard, createDrugBatch, getManufacturerBatches, getManufacturerBatchDetails, updateManufacturerBatch, deleteManufacturerBatch, getManufacturerBlockchain, getManufacturerBlockchainTx, getManufacturerAnalytics, getManufacturerShipments, getManufacturerShipmentDetails, createManufacturerShipment, updateManufacturerShipmentStatus, deleteManufacturerShipment, getManufacturerDropdowns } from "../controllers/manufacturerController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();
router.get("/drugbatch/form/dropdowns", getManufacturerDropdowns);

router.get("/shipments", getManufacturerShipments);
router.get("/shipments/:id", getManufacturerShipmentDetails);
router.post("/shipments", createManufacturerShipment);
router.put("/shipments/:id", updateManufacturerShipmentStatus);
router.delete("/shipments/:id", deleteManufacturerShipment);
router.get("/analytics", getManufacturerAnalytics);

router.get("/blockchain", getManufacturerBlockchain);
router.get("/blockchain/:tx", getManufacturerBlockchainTx);


router.use(authMiddleware);

router.get("/profile", getManufacturerProfile);
router.put("/profile", updateManufacturerProfile);
router.get("/dashboard", getManufacturerDashboard);

router.get("/batches", getManufacturerBatches);
router.post("/batches", createDrugBatch);
router.get("/batches/:id", getManufacturerBatchDetails);
router.put("/batches/:id", updateManufacturerBatch);
router.delete("/batches/:id", deleteManufacturerBatch);

export default router;
