// Audit Log actions
export async function getAuditLog(req, res, next) {
  try {
    const logs = await regulatorService.getAuditLog();
    res.json(logs);
  } catch (error) {
    next(error);
  }
}
// Counterfeit/Flagged Drugs for Traceability
export async function getFlaggedDrugs(req, res, next) {
  try {
    const drugs = await regulatorService.getFlaggedDrugs();
    res.json(drugs);
  } catch (error) {
    next(error);
  }
}

import * as regulatorService from "../services/regulatorService.js";
// Shipments for Traceability
export async function getShipments(req, res, next) {
  try {
    const shipments = await regulatorService.getShipments(req.query);
    res.json(shipments);
  } catch (error) {
    next(error);
  }
}

// Drug Batches for Traceability
export async function getDrugBatches(req, res, next) {
  try {
    const batches = await regulatorService.getDrugBatches(req.query);
    res.json(batches);
  } catch (error) {
    next(error);
  }
}

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
    // Pass user_id from authenticated user
    const audit = await regulatorService.createAudit({ ...req.body, user_id: req.user?.id });
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
    const analytics = await regulatorService.getRegulatorAnalytics();
    res.json(analytics);
  } catch (error) {
    next(error);
  }
}
