
import * as adminService from "../services/adminService.js";

// Dashboard KPIs
export async function getDashboard(req, res, next) {
  try {
    const dashboard = await adminService.getDashboardKPIs();
    res.json(dashboard);
  } catch (error) {
    next(error);
  }
}

// Reports
export async function getReports(req, res, next) {
  try {
    const reports = await adminService.getAllReports(req.query);
    res.json(reports);
  } catch (error) {
    next(error);
  }
}

// Analytics
export async function getAnalytics(req, res, next) {
  try {
    const analytics = await adminService.getSystemAnalytics();
    res.json(analytics);
  } catch (error) {
    next(error);
  }
}

// Blockchain logs
export async function getBlockchainLogs(req, res, next) {
  try {
    const logs = await adminService.getBlockchainLogs();
    res.json(logs);
  } catch (error) {
    next(error);
  }
}

// System settings update
export async function updateSettings(req, res, next) {
  try {
    const result = await adminService.updateSystemSettings(req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
}
