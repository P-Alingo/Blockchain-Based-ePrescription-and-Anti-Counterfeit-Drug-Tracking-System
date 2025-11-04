
import * as regulatorService from "../services/regulatorService.js";

// Dashboard summary
export async function getDashboard(req, res, next) {
  try {
    const summary = await regulatorService.getDashboardSummary();
    res.json(summary);
  } catch (error) {
    next(error);
  }
}

// Audits
export async function getAudits(req, res, next) {
  try {
    const audits = await regulatorService.getAllAudits();
    res.json(audits);
  } catch (error) {
    next(error);
  }
}

export async function createAudit(req, res, next) {
  try {
    const audit = await regulatorService.createAudit(req.body);
    res.status(201).json(audit);
  } catch (error) {
    next(error);
  }
}

// Reports
export async function getReports(req, res, next) {
  try {
    const reports = await regulatorService.getAllReports(req.query);
    res.json(reports);
  } catch (error) {
    next(error);
  }
}

export async function createReport(req, res, next) {
  try {
    const report = await regulatorService.createReport(req.body);
    res.status(201).json(report);
  } catch (error) {
    next(error);
  }
}

// Compliance actions
export async function getComplianceActions(req, res, next) {
  try {
    const actions = await regulatorService.getAllComplianceActions();
    res.json(actions);
  } catch (error) {
    next(error);
  }
}

export async function createComplianceAction(req, res, next) {
  try {
    const action = await regulatorService.createComplianceAction(req.body);
    res.status(201).json(action);
  } catch (error) {
    next(error);
  }
}

// Blockchain verification
export async function getBlockchainData(req, res, next) {
  try {
    const data = await regulatorService.getBlockchainVerification(req.query);
    res.json(data);
  } catch (error) {
    next(error);
  }
}

// Analytics
export async function getAnalytics(req, res, next) {
  try {
    const analytics = await regulatorService.getAnalyticsData(req.query);
    res.json(analytics);
  } catch (error) {
    next(error);
  }
}
