import express from "express";
import { recordSupplyChainEvent, listSupplyChainEvents } from "../controllers/supplyChainController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(authMiddleware, roleMiddleware(["MANUFACTURER", "DISTRIBUTOR", "PHARMACIST", "REGULATOR"]));

router.post("/events", recordSupplyChainEvent);
router.get("/events", listSupplyChainEvents);

export default router;
