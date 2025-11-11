
import { query } from "../config/database.js";

// Dashboard KPIs
export async function getDashboardKPIs() {
  // Total users by role
  const usersByRole = await query(`SELECT role, COUNT(*) as count FROM users GROUP BY role`);
  // Total prescriptions
  const prescriptions = await query(`SELECT COUNT(*) FROM prescription`);
  // Total shipments
  const shipments = await query(`SELECT COUNT(*) FROM shipment`);
  // Total batches
  const batches = await query(`SELECT COUNT(*) FROM drugbatch`);
  return {
    usersByRole: usersByRole.rows,
    totalPrescriptions: parseInt(prescriptions.rows[0].count, 10),
    totalShipments: parseInt(shipments.rows[0].count, 10),
    totalBatches: parseInt(batches.rows[0].count, 10)
  };
}

// Reports
export async function getAllReports(queryParams) {
  // Filter by user type, region, or date
  let where = [];
  let values = [];
  let idx = 1;
  if (queryParams.userType) {
    where.push(`user_type = $${idx++}`);
    values.push(queryParams.userType);
  }
  if (queryParams.region) {
    where.push(`region = $${idx++}`);
    values.push(queryParams.region);
  }
  if (queryParams.date) {
    where.push(`DATE(created_at) = $${idx++}`);
    values.push(queryParams.date);
  }
  const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const { rows } = await query(`SELECT * FROM reports ${whereClause} ORDER BY created_at DESC`, values);
  return rows;
}

// Analytics
export async function getSystemAnalytics() {
  // Total registered users by role
  const usersByRole = await query(`SELECT role, COUNT(*) as count FROM users WHERE is_deleted = false GROUP BY role`);
  // Active prescriptions
  const activePrescriptions = await query(`SELECT COUNT(*) FROM prescription WHERE status = 'issued' AND is_deleted = false`);
  // Total shipments
  const totalShipments = await query(`SELECT COUNT(*) FROM shipment WHERE is_deleted = false`);
  // Flagged shipments
  const flaggedShipments = await query(`SELECT COUNT(*) FROM shipment WHERE status = 'flagged' AND is_deleted = false`);
  // Failed shipments
  const failedShipments = await query(`SELECT COUNT(*) FROM shipment WHERE status = 'failed' AND is_deleted = false`);
  // Counterfeit drugs detected
  const counterfeitDrugs = await query(`SELECT COUNT(*) FROM drugbatch WHERE status = 'flagged' AND is_deleted = false`);
  // Recent blockchain transactions
  const recentBlockchainTx = await query(`SELECT id, eventname, contractname, transactionhash, timestamp FROM blockchaineventlog ORDER BY timestamp DESC LIMIT 10`);
  // Drug distribution by region/facility
  const drugDistribution = await query(`SELECT f.location, d.name AS drug_name, SUM(i.available_quantity) AS total_quantity FROM inventory i JOIN drug d ON i.drug_id = d.id JOIN facility f ON i.facility_id = f.id WHERE i.available_quantity > 0 GROUP BY f.location, d.name ORDER BY total_quantity DESC`);
  // Prescription volume trend (daily for last 14 days)
  const prescriptionTrend = await query(`SELECT DATE(issue_date) AS day, COUNT(*) AS count FROM prescription WHERE is_deleted = false GROUP BY day ORDER BY day DESC LIMIT 14`);
  // Recent activity feed (latest actions by users)
  const recentActivity = await query(`SELECT a.id, u.full_name AS user, a.action_type, a.entity_type, a.entity_id, a.timestamp, a.details FROM audit_log a LEFT JOIN users u ON a.user_id = u.id ORDER BY a.timestamp DESC LIMIT 10`);
  // Alerts panel: pending approvals, flagged drugs, failed shipments
  const pendingApprovals = await query(`SELECT id, pharmacist_id, distributor_id, batch_id, quantity_requested, request_date FROM batch_request WHERE status = 'pending' AND is_deleted = false ORDER BY request_date DESC LIMIT 5`);
  const flaggedDrugs = await query(`SELECT db.id, db.batchnumber, d.name AS drug_name, db.expirydate FROM drugbatch db JOIN drug d ON db.drugid = d.id WHERE db.status = 'flagged' AND db.is_deleted = false ORDER BY db.expirydate DESC LIMIT 5`);
  const failedShipmentsList = await query(`SELECT id, shipmentnumber, drug_id, quantity_shipped, departure_date FROM shipment WHERE status = 'failed' AND is_deleted = false ORDER BY departure_date DESC LIMIT 5`);
  return {
    stats: {
      usersByRole: usersByRole.rows,
      activePrescriptions: parseInt(activePrescriptions.rows[0].count, 10),
      totalShipments: parseInt(totalShipments.rows[0].count, 10),
      flaggedShipments: parseInt(flaggedShipments.rows[0].count, 10),
      failedShipments: parseInt(failedShipments.rows[0].count, 10),
      counterfeitDrugs: parseInt(counterfeitDrugs.rows[0].count, 10)
    },
    recentBlockchainTx: recentBlockchainTx.rows,
    drugDistribution: drugDistribution.rows,
    prescriptionTrend: prescriptionTrend.rows,
    recentActivity: recentActivity.rows,
    alerts: {
      pendingApprovals: pendingApprovals.rows,
      flaggedDrugs: flaggedDrugs.rows,
      failedShipments: failedShipmentsList.rows
    }
  };
}

// Blockchain logs and system settings
export async function getBlockchainLogs() {
  // All blockchain event logs
  const { rows: logs } = await query(`SELECT * FROM blockchaineventlog ORDER BY created_at DESC LIMIT 100`);
  // System settings (stub: replace with real DB fetch if needed)
  const { rows: settingsRows } = await query(`SELECT * FROM system_settings LIMIT 1`);
  const settings = settingsRows[0] || {
    systemStatus: "operational",
    maintenanceMode: false,
    notificationsEnabled: true,
    backupEnabled: true,
    databaseSize: "2.4 TB",
    lastBackup: "2 hours ago",
    activeUsers: 847
  };
  // Example node info (stub)
  const nodeInfo = { nodeUrl: "https://mainnet.infura.io/v3/your-key", synced: true, gasFee: "0.002 ETH" };
  return { logs, nodeInfo, settings };
}

// System settings update
export async function updateSystemSettings(settings) {
  // Update system settings in DB (stub: replace with real update logic)
  const keys = Object.keys(settings);
  if (keys.length === 0) return { success: false, message: "No settings provided" };
  const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(", ");
  const values = keys.map(k => settings[k]);
  await query(`UPDATE system_settings SET ${setClause}`, values);
  const { rows } = await query(`SELECT * FROM system_settings LIMIT 1`);
  return { success: true, updated: rows[0] || settings };
}
