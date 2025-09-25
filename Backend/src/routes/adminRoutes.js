import express from "express";
import * as adminController from "../controllers/adminController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import ROLES from "../config/roles.js";

const router = express.Router();

router.use(authMiddleware);
router.use(roleMiddleware([ROLES.ADMIN]));

router.get("/users", adminController.listUsers);
router.patch("/user-role/:id", adminController.updateUserRole);
router.get("/system-metrics", adminController.viewSystemMetrics);
router.post("/manage-contracts", adminController.manageSmartContracts);

export default router;
