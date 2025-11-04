
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

  // Highlight suspicious prescriptions (e.g., flagged, fraud, or high-risk)
  const suspiciousPrescriptions = (await query(
    `SELECT * FROM prescription WHERE status = 'flagged' OR fraudDetected = true OR riskScore >= 80 ORDER BY createdAt DESC LIMIT 5`
  )).rows;

  // Delayed shipments (e.g., status = delayed or ETA overdue)
  const delayedShipments = (await query(
    `SELECT * FROM shipment WHERE status = 'delayed' OR (eta < NOW() AND deliveredAt IS NULL) ORDER BY eta ASC LIMIT 5`
  )).rows;

  // Compliance rate (e.g., % of audits passed)
  const totalAudits = (await query('SELECT COUNT(*) FROM audit_log')).rows[0].count;
  const passedAudits = (await query("SELECT COUNT(*) FROM audit_log WHERE status = 'completed' AND score >= 80")).rows[0].count;
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
  return (await query('SELECT * FROM audit_log ORDER BY createdAt DESC LIMIT 50')).rows;
}

export async function createAudit(data) {
  // Insert audit
  const auditRes = await query(
    'INSERT INTO audit_log (facility, status, score, type, createdAt) VALUES ($1, $2, $3, $4, NOW()) RETURNING *',
    [data.facility, data.status, data.score, data.type || null]
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
  const res = await query(
    'INSERT INTO audit_log (facility, status, score, type, createdAt) VALUES ($1, $2, $3, $4, NOW()) RETURNING *',
    [data.facility, data.status, data.score, "COMPLIANCE"]
  );
  return res.rows[0];
}

// Blockchain verification
export async function getBlockchainVerification(query) {
  // Filter by eventType, company, referenceId, etc.
  let whereClause = '';
  const params = [];
  if (query.eventType) {
    params.push(query.eventType);
    whereClause += params.length === 1 ? 'WHERE eventType = $1' : ' AND eventType = $' + params.length;
  }
  if (query.company) {
    params.push(query.company);
    whereClause += whereClause ? ' AND company = $' + params.length : 'WHERE company = $' + params.length;
  }
  if (query.referenceId) {
    params.push(query.referenceId);
    whereClause += whereClause ? ' AND referenceId = $' + params.length : 'WHERE referenceId = $' + params.length;
  }
  const sql = `SELECT * FROM blockchaineventlog ${whereClause} ORDER BY createdAt DESC LIMIT 50`;
  return (await query(sql, params)).rows;
}

// Analytics
export async function getAnalyticsData(query) {
  // Aggregate compliance/fraud stats for charts
  const traceabilitySuccess = (await query('SELECT AVG(traceabilitySuccessRate) AS avg FROM analytics')).rows[0].avg || 0;
  const shipmentDelays = (await query('SELECT AVG(shipmentDelayRate) AS avg FROM analytics')).rows[0].avg || 0;
  const fraudDetection = (await query('SELECT AVG(fraudDetectionRate) AS avg FROM analytics')).rows[0].avg || 0;

  // Recent reports for export
  const recentReports = (await query('SELECT * FROM reports ORDER BY createdAt DESC LIMIT 5')).rows;

  return {
    traceabilitySuccess,
    shipmentDelays,
    fraudDetection,
    recentReports
  };
}
