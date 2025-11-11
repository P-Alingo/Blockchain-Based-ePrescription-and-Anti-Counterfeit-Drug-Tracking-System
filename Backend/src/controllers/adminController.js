// Add row to table
export async function addTableRow(req, res, next) {
  try {
    const { table } = req.params;
    const rowData = req.body;
    if (!table || !rowData) return res.status(400).json({ error: 'Table name and row data required' });
    const result = await adminService.addTableRow(table, rowData);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

// Update row in table (dynamic primary key)
export async function updateTableRow(req, res, next) {
  try {
    const { table, id } = req.params;
    const rowData = req.body;
    if (!table || !id || !rowData) return res.status(400).json({ error: 'Table name, id, and row data required' });
    const result = await adminService.updateTableRow(table, id, rowData);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

// Delete row from table (dynamic primary key)
export async function deleteTableRow(req, res, next) {
  try {
    const { table, id } = req.params;
    if (!table || !id) return res.status(400).json({ error: 'Table name and id required' });
    const result = await adminService.deleteTableRow(table, id);
    res.json(result);
  } catch (error) {
    next(error);
  }
}
// List all tables
export async function listTables(req, res, next) {
  try {
    const tables = await adminService.listDatabaseTables();
    res.json({ tables });
  } catch (error) {
    next(error);
  }
}

// Get table data (include primary key)
export async function getTableData(req, res, next) {
  try {
    const { table } = req.params;
    if (!table) return res.status(400).json({ error: 'Table name required' });
    const data = await adminService.getTableData(table);
    res.json(data);
  } catch (error) {
    next(error);
  }
}

import * as adminService from "../services/adminService.js";

// Search and filter audit logs
export async function searchAuditLogs(req, res, next) {
  try {
    const filters = req.query;
    const logs = await adminService.searchAuditLogs(filters);
    res.json(logs);
  } catch (error) {
    next(error);
  }
}

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
