import express from "express";
import { generateQrCode, getQrCode } from "../controllers/qrCodeController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/", generateQrCode);
router.get("/:id", getQrCode);

export default router;
