import express from "express";
import { generateReport, getAllReports, getReportById, downloadReport } from "../controllers/reportController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();
router.use(authMiddleware);

router.post("/generate", generateReport);
router.get("/", getAllReports);
router.get("/:id", getReportById);
router.get("/download/:id", downloadReport);

export default router;
