
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
  // Active users per month
  const activeUsers = await query(`SELECT DATE_TRUNC('month', created_at) as month, COUNT(*) as count FROM users WHERE active = true GROUP BY month ORDER BY month DESC LIMIT 12`);
  // Prescriptions per doctor
  const prescriptionsPerDoctor = await query(`SELECT doctor_id, COUNT(*) as count FROM prescription GROUP BY doctor_id ORDER BY count DESC LIMIT 10`);
  // Shipments per distributor
  const shipmentsPerDistributor = await query(`SELECT distributor_id, COUNT(*) as count FROM shipment GROUP BY distributor_id ORDER BY count DESC LIMIT 10`);
  // Drug batch success vs recall rates
  const batchStats = await query(`SELECT status, COUNT(*) as count FROM drugbatch GROUP BY status`);
  return {
    activeUsers: activeUsers.rows,
    prescriptionsPerDoctor: prescriptionsPerDoctor.rows,
    shipmentsPerDistributor: shipmentsPerDistributor.rows,
    batchStats: batchStats.rows
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
