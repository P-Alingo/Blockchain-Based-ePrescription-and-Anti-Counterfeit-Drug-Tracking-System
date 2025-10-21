import express from "express";
import { createRevocation, listRevocations } from "../controllers/revocationController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(authMiddleware, roleMiddleware(["DOCTOR", "ADMIN"]));

router.post("/", createRevocation);
router.get("/", listRevocations);

export default router;
