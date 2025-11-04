// Dashboard
async function getDistributorDashboard(distributorId) {
  // Shipments handled this month
  const shipmentsMonth = await query(`
    SELECT COUNT(*) AS count FROM shipment
    WHERE distributor_id = $1 AND departure_date >= date_trunc('month', CURRENT_DATE)
  `, [distributorId]);

  // Average delivery duration (in days)
  const avgDelivery = await query(`
    SELECT AVG(EXTRACT(EPOCH FROM (arrival_date - departure_date)) / 86400) AS avg_days
    FROM shipment WHERE distributor_id = $1 AND arrival_date IS NOT NULL
  `, [distributorId]);

  // Requests awaiting approval
  const pendingRequests = await query(`
    SELECT COUNT(*) AS count FROM batch_request
    WHERE distributor_id = $1 AND status = 'pending'
  `, [distributorId]);

  return {
    shipmentsThisMonth: Number(shipmentsMonth.rows[0]?.count ?? 0),
    avgDeliveryDays: Number(avgDelivery.rows[0]?.avg_days ?? 0),
    pendingRequests: Number(pendingRequests.rows[0]?.count ?? 0)
  };
}

// Requests
async function getDistributorRequests(distributorId) {
  // Get pending batch requests with drug and pharmacist info
  const { rows } = await query(`
    SELECT br.id, br.status, br.request_date, br.quantity_requested, db.batchnumber, db.drugid, u.full_name AS pharmacist, p.id AS pharmacist_id
    FROM batch_request br
    JOIN drugbatch db ON db.id = br.batch_id
    JOIN pharmacist p ON p.id = br.pharmacist_id
    LEFT JOIN users u ON p.userid = u.id
    WHERE br.distributor_id = $1 AND br.status = 'pending'
    ORDER BY br.request_date DESC
  `, [distributorId]);
  return rows;
}
async function approveDistributorRequest(distributorId, requestId) {
  // Mark request as approved
  await query(`UPDATE batch_request SET status = 'Approved', approved_date = CURRENT_DATE WHERE id = $1 AND distributor_id = $2`, [requestId, distributorId]);
  // Create shipment from manufacturer (simplified)
  // You may want to fetch batch info and call shipment creation logic here
  return true;
}
async function rejectDistributorRequest(distributorId, requestId) {
  // Mark request as rejected
  await query(`UPDATE batch_request SET status = 'Rejected', rejected_date = CURRENT_DATE WHERE id = $1 AND distributor_id = $2`, [requestId, distributorId]);
  // Notification logic can be added here
  return true;
}

// Shipments
async function getDistributorShipments(distributorId) {
  // Get all shipments for distributor
  const { rows } = await query(`
    SELECT s.*, db.batchnumber, db.drugid, f.name AS facility, db.quantity
    FROM shipment s
    JOIN drugbatch db ON db.id = s.batch_id
    LEFT JOIN facility f ON f.id = s.destination_facility_id
    WHERE s.distributor_id = $1
    ORDER BY s.departure_date DESC
  `, [distributorId]);
  return rows;
}
async function createDistributorShipment(distributorId, shipmentData) {
  // Insert new shipment (simplified)
  const { batch_id, drug_id, shipment_type, departure_date, route, vehicle_number, quantity } = shipmentData;
  await query(`
    INSERT INTO shipment (distributor_id, batch_id, drug_id, shipment_type, departure_date, route, vehicle_number, quantity, status)
  VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'pending')
  `, [distributorId, batch_id, drug_id, shipment_type, departure_date, route, vehicle_number, quantity]);
  return true;
}
async function updateDistributorShipmentStatus(distributorId, shipmentId, status) {
  // Update shipment status and record arrival/condition if delivered
  await query(`UPDATE shipment SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND distributor_id = $3`, [status, shipmentId, distributorId]);
  return true;
}

// Inventory
async function getDistributorInventory(distributorId) {
  // Get inventory batches and quantities for distributor
  // Join distributor -> drugbatch -> inventory
  const { rows } = await query(`
    SELECT i.id, i.batch_id, db.batchnumber, db.drugid, i.quantity
    FROM inventory i
    JOIN drugbatch db ON db.id = i.batch_id
    JOIN distributor d ON d.companyid = db.distributorcompanyid
    WHERE d.id = $1
    ORDER BY i.id DESC
  `, [distributorId]);
  return rows;
}
async function addDistributorInventory(distributorId, batchData) {
  // Add batch to inventory
  const { batch_id, quantity } = batchData;
  // Find distributor's facility_id via company
  const distributor = await query('SELECT companyid FROM distributor WHERE id = $1', [distributorId]);
  const companyId = distributor.rows[0]?.companyid;
  const company = await query('SELECT facility_id FROM distributor_company WHERE id = $1', [companyId]);
  const facilityId = company.rows[0]?.facility_id;
  await query(`INSERT INTO inventory (batch_id, quantity, facility_type, facility_id) VALUES ($1,$2,'distributor',$3)`, [batch_id, quantity, facilityId]);
  return true;
}

// Blockchain
async function getDistributorBlockchain(distributorId) {
  // Get blockchain events for distributor
  const { rows } = await query(`
    SELECT * FROM blockchaineventlog WHERE entitytype = 'distributor' AND entityid = $1 ORDER BY timestamp DESC
  `, [distributorId]);
  return rows;
}

// Analytics
async function getDistributorAnalytics(distributorId) {
  // Shipments per region
  const shipmentsPerRegion = await query(`
    SELECT f.name AS region, COUNT(*) AS count
    FROM shipment s
    LEFT JOIN facility f ON f.id = s.destination_facility_id
    WHERE s.distributor_id = $1
    GROUP BY f.name
    ORDER BY count DESC
  `, [distributorId]);

  // Average delivery speed
  const avgDeliverySpeed = await query(`
    SELECT AVG(EXTRACT(EPOCH FROM (arrival_date - departure_date)) / 3600) AS avg_hours
    FROM shipment WHERE distributor_id = $1 AND arrival_date IS NOT NULL
  `, [distributorId]);

  // Workload by manufacturer
  const workloadByManufacturer = await query(`
    SELECT db.manufacturerid, COUNT(*) AS shipment_count
    FROM shipment s
    JOIN drugbatch db ON db.id = s.batch_id
    WHERE s.distributor_id = $1
    GROUP BY db.manufacturerid
    ORDER BY shipment_count DESC
  `, [distributorId]);

  // Downloadable logistics report (return raw data)
  const logisticsReport = await query(`
    SELECT s.*, db.batchnumber, db.drugid, f.name AS facility
    FROM shipment s
    JOIN drugbatch db ON db.id = s.batch_id
    LEFT JOIN facility f ON f.id = s.destination_facility_id
    WHERE s.distributor_id = $1
    ORDER BY s.departure_date DESC
  `, [distributorId]);

  return {
    shipmentsPerRegion: shipmentsPerRegion.rows,
    avgDeliverySpeed: Number(avgDeliverySpeed.rows[0]?.avg_hours ?? 0),
    workloadByManufacturer: workloadByManufacturer.rows,
    logisticsReport: logisticsReport.rows
  };
}
import { query } from "../config/database.js";


async function getDistributorByUserId(userId) {
  const { rows } = await query("SELECT * FROM distributor WHERE userid = $1", [userId]);
  return rows[0] || null;
}


async function updateDistributorByUserId(userId, updateData) {
  const keys = Object.keys(updateData);
  if (keys.length === 0) return null;
  const setClause = keys.map((k, i) => `${k} = $${i + 2}`).join(", ");
  const values = [userId, ...keys.map(k => updateData[k])];
  await query(`UPDATE distributor SET ${setClause} WHERE userid = $1`, values);
  const { rows } = await query("SELECT * FROM distributor WHERE userid = $1", [userId]);
  return rows[0] || null;
}

export {
  getDistributorByUserId,
  updateDistributorByUserId,
  getDistributorDashboard,
  getDistributorRequests,
  approveDistributorRequest,
  rejectDistributorRequest,
  getDistributorShipments,
  createDistributorShipment,
  updateDistributorShipmentStatus,
  getDistributorInventory,
  addDistributorInventory,
  getDistributorBlockchain,
  getDistributorAnalytics
};
