import express from "express";
import { listBlockchainEvents, getBlockchainEvent } from "../controllers/blockchainEventLogController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", listBlockchainEvents);
router.get("/:id", getBlockchainEvent);

export default router;
