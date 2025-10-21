import express from "express";
import { getPharmacistProfile, updatePharmacistProfile } from "../controllers/pharmacistController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(authMiddleware, roleMiddleware(["PHARMACIST"]));

router.get("/profile", getPharmacistProfile);
router.put("/profile", updatePharmacistProfile);

export default router;
