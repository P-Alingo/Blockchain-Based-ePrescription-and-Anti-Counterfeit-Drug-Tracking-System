import express from "express";
import { createDispenseRecord, listDispenseRecords } from "../controllers/dispenseRecordController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(authMiddleware, roleMiddleware(["PHARMACIST", "ADMIN"]));

router.post("/", createDispenseRecord);
router.get("/", listDispenseRecords);

export default router;
