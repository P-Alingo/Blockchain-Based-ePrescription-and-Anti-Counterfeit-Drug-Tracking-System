import express from "express";
import { getAdminProfile, updateAdminProfile } from "../controllers/adminController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/profile", getAdminProfile);
router.put("/profile", updateAdminProfile);

export default router;
