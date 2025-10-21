import express from "express";
import { generateReport, listReports } from "../controllers/reportController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(authMiddleware, roleMiddleware(["ADMIN", "REGULATOR"]));

router.post("/", generateReport);
router.get("/", listReports);

export default router;
