import express from "express";
import * as userController from "../controllers/userController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/enable", authMiddleware, userController.enable2FA);
router.post("/verify", authMiddleware, userController.verify2FA);

export default router;
