import express from 'express';
import {
  getDistributorShipments,
  getDistributorShipmentById,
  updateDistributorShipment,
  claimShipment,
  getDistributorShipmentStatistics
} from '../controllers/shipmentController.js';
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// ------------------------------
// Distributor-Specific Routes
// ------------------------------

// Get shipments for distributor's facility
router.get('/distributor/shipments', authMiddleware, getDistributorShipments);

// Get distributor shipment statistics (dashboard)
router.get('/distributor/shipments/stats/overview', authMiddleware, getDistributorShipmentStatistics);

// Get a single distributor shipment by ID
router.get('/distributor/shipments/:id', authMiddleware, getDistributorShipmentById);

// Update distributor shipment by ID
router.put('/distributor/shipments/:id', authMiddleware, updateDistributorShipment);

// Claim an unassigned shipment
router.post('/distributor/shipments/:id/claim', authMiddleware, claimShipment);

export default router;
