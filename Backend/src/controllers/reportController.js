import path from "path";
import { fileURLToPath } from "url";
export async function downloadReport(req, res, next) {
  try {
    const id = req.params.id;
    const filePath = await reportService.getReportFilePath(id);
    if (!filePath) return res.status(404).json({ message: "Report file not found" });

    // Resolve absolute path to file
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const absolutePath = path.resolve(__dirname, "../../..", filePath);

    // Set headers for download
    res.download(absolutePath, path.basename(filePath), (err) => {
      if (err) return next(err);
    });
  } catch (error) {
    next(error);
  }
}
import * as reportService from "../services/reportService.js";

export async function generateReport(req, res, next) {
  try {
    const report = await reportService.generateReport(req.body);
    res.status(201).json(report);
  } catch (error) {
    next(error);
  }
}

export async function getAllReports(req, res, next) {
  try {
    const reports = await reportService.getAllReports();
    res.json(reports);
  } catch (error) {
    next(error);
  }
}

export async function getReportById(req, res, next) {
  try {
    const report = await reportService.getReportById(req.params.id);
    if (!report) return res.status(404).json({ message: "Report not found" });
    res.json(report);
  } catch (error) {
    next(error);
  }
}
