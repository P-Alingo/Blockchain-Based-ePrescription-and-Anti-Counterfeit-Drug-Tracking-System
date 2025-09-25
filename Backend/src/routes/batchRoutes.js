import express from "express";
import * as batchController from "../controllers/batchController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import ROLES from "../config/roles.js";

const router = express.Router();

router.post("/", authMiddleware, roleMiddleware([ROLES.MANUFACTURER]), batchController.createBatch);
router.get("/:id", authMiddleware, batchController.getBatchById);
router.get("/manufacturer/:id", authMiddleware, batchController.listBatchesByManufacturer);
router.post("/verify-qr", batchController.verifyBatchQRCode);

export default router;
