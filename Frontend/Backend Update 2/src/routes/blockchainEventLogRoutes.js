import express from "express";
import { listBlockchainEvents, getBlockchainEvent } from "../controllers/blockchainEventLogController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(authMiddleware, roleMiddleware(["ADMIN", "REGULATOR"]));

router.get("/", listBlockchainEvents);
router.get("/:id", getBlockchainEvent);

export default router;
