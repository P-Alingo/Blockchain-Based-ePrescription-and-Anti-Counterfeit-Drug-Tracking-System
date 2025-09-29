import express from "express";
import { getRoles } from "../controllers/roleController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", getRoles);

export default router;
