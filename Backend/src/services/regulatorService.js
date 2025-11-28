// Audit Log actions
export async function getAuditLog() {
  const sql = `
    SELECT a.id, u.full_name AS user, a.action_type, a.entity_type, a.entity_id, a.timestamp, a.details
    FROM audit_log a
    LEFT JOIN users u ON a.user_id = u.id
    ORDER BY a.timestamp DESC
    LIMIT 200
  `;
  return (await query(sql)).rows;
}
// Flagged/Counterfeit Drugs for Traceability
export async function getFlaggedDrugs() {
  // Select flagged/counterfeit shipments (status = 'flagged' or received_condition ILIKE '%counterfeit%')
  const sql = `
    SELECT s.id, s.drug_id, s.batch_id, s.manufacturer_id, s.arrival_date, s.received_condition,
           d.name AS drug_name, b.batchnumber, mc.name AS manufacturer_name
    FROM shipment s
    LEFT JOIN drug d ON s.drug_id = d.id
    LEFT JOIN drugbatch b ON s.batch_id = b.id
    LEFT JOIN manufacturer m ON s.manufacturer_id = m.id
    LEFT JOIN manufacturer_company mc ON m.companyid = mc.id
    WHERE s.status = 'flagged' OR s.received_condition ILIKE '%counterfeit%'
    ORDER BY s.arrival_date DESC
    LIMIT 100
  `;
  return (await query(sql)).rows;
}
// Regulator Analytics Dashboard
export async function getRegulatorAnalytics() {
  // Total Shipments Monitored
  const totalShipments = (await query('SELECT COUNT(*) FROM shipment')).rows[0].count;

  // Flagged Batches Detected (count batches with flagged shipments)
  const flaggedBatches = (await query(`SELECT COUNT(DISTINCT batch_id) FROM shipment WHERE status = 'flagged'`)).rows[0]?.count || 0;

  // Counterfeit Incidents Confirmed (same as flaggedBatches for now)
  const counterfeitIncidents = flaggedBatches;

  // Flagged Drugs Over Time (for chart)
  const flaggedDrugsOverTime = (await query(`SELECT DATE_TRUNC('month', issue_date) AS month, COUNT(*) AS count FROM prescription WHERE status IN ('issued', 'dispensed', 'expired') GROUP BY month ORDER BY month ASC`)).rows;

  // Top Manufacturers (for chart)
  const topManufacturers = (await query(`SELECT manufacturerid, COUNT(*) AS count FROM drugbatch GROUP BY manufacturerid ORDER BY count DESC LIMIT 5`)).rows;

  // Total Prescriptions (for chart)
  const totalPrescriptions = (await query(`SELECT DATE_TRUNC('month', issue_date) AS month, COUNT(*) AS count FROM prescription GROUP BY month ORDER BY month ASC`)).rows;

  return {
    totalShipments,
    flaggedBatches,
    counterfeitIncidents,
    flaggedDrugsOverTime,
    topManufacturers,
    totalPrescriptions
  };
}
// Shipments for Traceability
export async function getShipments(queryParams) {
  let whereClause = '';
  const params = [];
  if (queryParams.search) {
    params.push(`%${queryParams.search}%`);
    whereClause += params.length === 1 ? 'WHERE shipmentnumber ILIKE $1 OR route ILIKE $1 OR vehicle_number ILIKE $1' : ' AND (shipmentnumber ILIKE $' + params.length + ' OR route ILIKE $' + params.length + ' OR vehicle_number ILIKE $' + params.length + ')';
  }
  // Shipment table has 'status' column, so this is valid
  if (queryParams.status && queryParams.status !== 'all') {
    params.push(queryParams.status);
    whereClause += whereClause ? ' AND status = $' + params.length : 'WHERE status = $' + params.length;
  }
  const sql = `SELECT * FROM shipment ${whereClause} ORDER BY departure_date DESC LIMIT 50`;
  return (await query(sql, params)).rows;
}

// Drug Batches for Traceability
export async function getDrugBatches(queryParams) {
  let whereClause = '';
  const params = [];
  if (queryParams.search) {
    params.push(`%${queryParams.search}%`);
    whereClause += params.length === 1
      ? 'WHERE b.batchnumber ILIKE $1 OR b.drugid::text ILIKE $1 OR b.distributorcompanyid::text ILIKE $1 OR b.distributor_facility_id::text ILIKE $1'
      : ' AND (b.batchnumber ILIKE $' + params.length + ' OR b.drugid::text ILIKE $' + params.length + ' OR b.distributorcompanyid::text ILIKE $' + params.length + ' OR b.distributor_facility_id::text ILIKE $' + params.length + ')';
  }
  // Date range filter (if provided, always use manufacturedate)
  if (queryParams.dateRange && queryParams.dateRange !== 'all') {
    let dateCondition = '';
    switch (queryParams.dateRange) {
      case 'today':
        dateCondition = `b.manufacturedate::date = CURRENT_DATE`;
        break;
      case 'week':
        dateCondition = `b.manufacturedate >= date_trunc('week', CURRENT_DATE)`;
        break;
      case 'month':
        dateCondition = `b.manufacturedate >= date_trunc('month', CURRENT_DATE)`;
        break;
      case 'year':
        dateCondition = `b.manufacturedate >= date_trunc('year', CURRENT_DATE)`;
        break;
    }
    if (dateCondition) {
      whereClause += whereClause ? ` AND ${dateCondition}` : `WHERE ${dateCondition}`;
    }
  }
  const sql = `
    SELECT b.*, d.name AS drug_name,
      dc.name AS distributor_company_name,
      f.name AS distributor_facility_name,
      s.shipmentnumber, s.status AS shipment_status
    FROM drugbatch b
    LEFT JOIN drug d ON b.drugid = d.id
    LEFT JOIN shipment s ON s.batch_id = b.id
    LEFT JOIN distributor_company dc ON b.distributorcompanyid = dc.id
    LEFT JOIN facility f ON b.distributor_facility_id = f.id
    ${whereClause}
    ORDER BY b.manufacturedate DESC
    LIMIT 50
  `;
  return (await query(sql, params)).rows;
}

import { query } from "../config/database.js";

// Dashboard summary
export async function getDashboardSummary() {
  // Summarize ecosystem stats
  const [prescriptions, batches, shipments, audits] = await Promise.all([
    (await query('SELECT COUNT(*) FROM prescription')).rows[0].count,
    (await query('SELECT COUNT(*) FROM drugbatch')).rows[0].count,
    (await query('SELECT COUNT(*) FROM shipment')).rows[0].count,
    (await query('SELECT COUNT(*) FROM audit_log')).rows[0].count,
  ]);

  // Highlight suspicious prescriptions (prescription table has 'status')
  const suspiciousPrescriptions = (await query(
    `SELECT * FROM prescription WHERE status IN ('issued', 'dispensed', 'expired') ORDER BY issue_date DESC LIMIT 5`
  )).rows;

    // Delayed shipments: only status 'failed', and arrival_date overdue
    const delayedShipments = (await query(
      `SELECT * FROM shipment WHERE (status = 'failed' OR (arrival_date < NOW() AND status != 'delivered' AND status != 'completed')) ORDER BY arrival_date ASC LIMIT 5`
    )).rows;

  // Compliance rate (audit_log table: only use status = 'completed' if available)
  let passedAudits = 0;
  try {
    // Try with status column only
    passedAudits = (await query("SELECT COUNT(*) FROM audit_log WHERE status = 'completed'")).rows[0].count;
  } catch {
    // Fallback if status column does not exist
    passedAudits = 0;
  }
  // Audits count: match audit_log table
  const totalAudits = (await query('SELECT COUNT(*) FROM audit_log')).rows[0].count;
  const complianceRate = totalAudits > 0 ? Math.round((passedAudits / totalAudits) * 1000) / 10 : 0;

  return {
    prescriptions,
    batches,
    shipments,
    audits,
    suspiciousPrescriptions,
    delayedShipments,
    complianceRate
  };
}

// Audits
export async function getAllAudits() {
  // Recent actions (create, modify, dispense)
  return (await query('SELECT * FROM audit_log ORDER BY timestamp DESC LIMIT 50')).rows;
}

export async function createAudit(data) {
  // Insert audit
  // If audit_log has 'status' column, keep this. Otherwise, remove 'status' from insert.
  // Insert user_id into audit_log
  const auditRes = await query(
    'INSERT INTO audit_log (user_id, facility, status, score, type, createdAt) VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *',
    [data.user_id, data.facility, data.status, data.score, data.type || null]
  );
  const audit = auditRes.rows[0];
  // Optionally add blockchain event log
  await query(
    'INSERT INTO blockchaineventlog (eventType, referenceId, details, createdAt) VALUES ($1, $2, $3, NOW())',
    ["audit_created", audit.id, `Audit created for ${audit.facility || "unknown facility"}`]
  );
  return audit;
}

// Reports
export async function getAllReports(query) {
  // Filter by actor/type if provided
  let whereClause = '';
  const params = [];
  if (query.actor) {
    params.push(query.actor);
    whereClause += params.length === 1 ? 'WHERE actor = $1' : ' AND actor = $' + params.length;
  }
  if (query.type) {
    params.push(query.type);
    whereClause += whereClause ? ' AND type = $' + params.length : 'WHERE type = $' + params.length;
  }
  const sql = `SELECT * FROM reports ${whereClause} ORDER BY createdAt DESC`;
  return (await query(sql, params)).rows;
}

export async function createReport(data) {
  // Insert report
  const reportRes = await query(
    'INSERT INTO reports (actor, type, content, createdAt) VALUES ($1, $2, $3, NOW()) RETURNING *',
    [data.actor, data.type, data.content]
  );
  const report = reportRes.rows[0];
  // Optionally add analytics record
  await query(
    'INSERT INTO analytics (reportId, generatedAt, type) VALUES ($1, NOW(), $2)',
    [report.id, report.type || "general"]
  );
  return report;
}

// Compliance actions
export async function getAllComplianceActions() {
  // List compliance actions (warnings, suspensions, follow-ups)
  return (await query("SELECT * FROM audit_log WHERE type = 'COMPLIANCE' ORDER BY createdAt DESC LIMIT 50")).rows;
}

export async function createComplianceAction(data) {
  // Record new compliance action
  // If audit_log has 'status' column, keep this. Otherwise, remove 'status' from insert.
  const res = await query(
    'INSERT INTO audit_log (facility, status, score, type, createdAt) VALUES ($1, $2, $3, $4, NOW()) RETURNING *',
    [data.facility, data.status, data.score, "COMPLIANCE"]
  );
  return res.rows[0];
}

// Blockchain verification
export async function getBlockchainVerification() {
  const serializeFlagged = (entries = []) =>
    entries.map(item => ({
      flagId: item.flagId?.toString?.() ?? item.flagId,
      entityId: item.entityId?.toString?.() ?? item.entityId,
      entityType: item.entityType,
      reason: item.reason,
      flaggedBy: item.flaggedBy,
      userAddress: item.userAddress,
      status: item.status,
      timestamp: item.timestamp
        ? new Date(Number(item.timestamp.toString()) * 1000).toISOString()
        : new Date().toISOString()
    }));

  let flaggedBatches = [];
  let flaggedPrescriptions = [];
  let flaggedUsers = [];
  try {
    const [batches, prescriptions, users] = await Promise.all([
      getFlaggedEntitiesOnChain("batch"),
      getFlaggedEntitiesOnChain("prescription"),
      getFlaggedEntitiesOnChain("user")
    ]);
    flaggedBatches = serializeFlagged(batches);
    flaggedPrescriptions = serializeFlagged(prescriptions);
    flaggedUsers = serializeFlagged(users);
  } catch (error) {
    console.error('❌ Failed to fetch flagged entities from chain, falling back to database:', error);
    const fallbackRows = await query(
      `SELECT * FROM blockchaineventlog WHERE eventname ILIKE '%flag%' ORDER BY timestamp DESC LIMIT 50`
    );
    flaggedBatches = fallbackRows.rows.filter(row => row.entitytype === 'batch');
    flaggedPrescriptions = fallbackRows.rows.filter(row => row.entitytype === 'prescription');
    flaggedUsers = fallbackRows.rows.filter(row => row.entitytype === 'user');
  }

  const auditLogs = await getAuditLog();

  return {
    flaggedBatches,
    flaggedPrescriptions,
    userViolations: flaggedUsers.map(user => ({
      username: user.userAddress || user.flaggedBy,
      violation: user.reason || 'Flagged by regulator',
      action: user.status,
      timestamp: user.timestamp
    })),
    auditLogs
  };
}

// RegulatorOversight contract integration
import { logAuditOnChain, getFlaggedEntitiesOnChain } from "./blockchainService.js";

// Log audit event on-chain
export async function logRegulatorAuditEvent(auditData) {
  try {
    // Get regulator/admin wallet address and private key from auditData or session
    const { description, entityType, entityId } = auditData;
    // Always use admin wallet credentials from environment
    const { ethers } = require("ethers");
    const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
    const adminPrivateKey = process.env.ADMIN_PRIVATE_KEY;
    if (!adminPrivateKey) throw new Error("Missing ADMIN_PRIVATE_KEY in environment");
    const wallet = new ethers.Wallet(adminPrivateKey, provider);
    const RegulatorOversightABI = require("../../../Smart Contracts/DrugSupplyChainABI.json"); // Replace with correct ABI path
    const contract = new ethers.Contract(
      process.env.REGULATOR_OVERSIGHT_ADDRESS,
      RegulatorOversightABI,
      wallet
    );

    // Call logAudit on-chain
    const tx = await contract.logAudit(description, entityType, entityId);
    await tx.wait();
    return { success: true, txHash: tx.hash };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Get flagged batches from blockchain
export async function getFlaggedBatchesOnChain() {
  try {
    return await getFlaggedEntitiesOnChain("batch");
  } catch (error) {
    console.error("❌ Failed to fetch flagged batches from blockchain:", error);
    return [];
  }
}

// Get flagged prescriptions from blockchain
export async function getFlaggedPrescriptionsOnChain() {
  try {
    return await getFlaggedEntitiesOnChain("prescription");
  } catch (error) {
    console.error("❌ Failed to fetch flagged prescriptions from blockchain:", error);
    return [];
  }
}
