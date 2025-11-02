import express from "express";
import {
  createDrugBatch,
  getAllDrugBatches,
  getDrugBatch,
  updateDrugBatch,
  deleteDrugBatch,
  getDropdownData,
  getQCBatches,
  getBatchStatistics
} from "../controllers/drugBatchController.js";
import { authMiddleware } from "../middleware/authMiddleware.js"; 

const router = express.Router();

// ------------------------------
// Drug Batch Routes
// ------------------------------

// Get dropdown data for forms
router.get("/form/dropdowns", authMiddleware, getDropdownData);

// Get batch statistics
router.get("/stats/overview", authMiddleware, getBatchStatistics);

// Get batches for quality control officers
router.get("/qc/batches", authMiddleware, getQCBatches);

// Get all drug batches
router.get("/", authMiddleware, getAllDrugBatches);

// Get a single drug batch by ID
router.get("/:id", authMiddleware, getDrugBatch);

// Create a new drug batch
router.post("/", authMiddleware, createDrugBatch);

// Update a drug batch by ID
router.put("/:id", authMiddleware, updateDrugBatch);

// Delete a drug batch by ID
router.delete("/:id", authMiddleware, deleteDrugBatch);

export default router;