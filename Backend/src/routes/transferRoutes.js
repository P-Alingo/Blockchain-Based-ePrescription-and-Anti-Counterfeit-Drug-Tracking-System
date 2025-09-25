import express from "express";
import * as transferController from "../controllers/transferController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import ROLES from "../config/roles.js";

const router = express.Router();

router.post(
  "/initiate",
  authMiddleware,
  roleMiddleware([ROLES.DISTRIBUTOR, ROLES.PHARMACIST]),
  transferController.initiateTransfer
);
router.post(
  "/complete",
  authMiddleware,
  roleMiddleware([ROLES.DISTRIBUTOR, ROLES.PHARMACIST]),
  transferController.completeTransfer
);
router.get("/user/:userId", authMiddleware, transferController.listTransfersByUser);

export default router;
