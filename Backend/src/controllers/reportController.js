import * as reportService from "../services/reportService.js";

async function generateReport(req, res, next) {
  try {
    const { type, filters } = req.body;
    const report = await reportService.generateReport(type, filters);
    res.json(report);
  } catch (error) {
    next(error);
  }
}

async function listReports(req, res, next) {
  try {
    const reports = await reportService.listReports();
    res.json(reports);
  } catch (error) {
    next(error);
  }
}

export { generateReport, listReports };
