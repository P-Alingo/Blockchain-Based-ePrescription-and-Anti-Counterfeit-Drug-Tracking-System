import express from "express";
import {
  createDrugBatch,
  getDrugBatch,
  updateDrugBatch,
  deleteDrugBatch,
} from "../controllers/drugBatchController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(authMiddleware, roleMiddleware(["MANUFACTURER"]));

router.post("/", createDrugBatch);
router.get("/:id", getDrugBatch);
router.put("/:id", updateDrugBatch);
router.delete("/:id", deleteDrugBatch);

export default router;
