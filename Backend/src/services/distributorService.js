// Get all drugs, batches, batch quantities, and requests for distributor dashboard
async function getDistributorDrugRequests(distributorId) {
  // Get all drugs
  const drugsRes = await query(`SELECT * FROM drug WHERE is_deleted = false ORDER BY name ASC`);
  const drugs = drugsRes.rows;

  // Get all batches for this distributor
  const batchesRes = await query(`
    SELECT db.*, d.name as drug_name
    FROM drugbatch db
    JOIN drug d ON db.drugid = d.id
    WHERE db.distributorcompanyid = (SELECT companyid FROM distributor WHERE id = $1)
      AND db.is_deleted = false
    ORDER BY db.id DESC
  `, [distributorId]);
  const batches = batchesRes.rows;

  // Get all requests for this distributor, including pharmacist facility and manufacturer name
  const requestsRes = await query(`
    SELECT br.*, u.full_name as pharmacist_name,
      pc.name as pharmacy_company_name, f.name as pharmacy_facility_name,
      mc.name as manufacturer_company_name, mf.name as manufacturer_facility_name
    FROM batch_request br
    LEFT JOIN pharmacist p ON p.id = br.pharmacist_id
    LEFT JOIN users u ON p.userid = u.id
    LEFT JOIN pharmacy_company pc ON p.companyid = pc.id
    LEFT JOIN facility f ON pc.facility_id = f.id
    LEFT JOIN drugbatch db ON br.batch_id = db.id
    LEFT JOIN manufacturer m ON db.manufacturerid = m.id
    LEFT JOIN manufacturer_company mc ON m.companyid = mc.id
    LEFT JOIN facility mf ON mc.facility_id = mf.id
    WHERE br.distributor_id = $1 AND (br.is_deleted IS NULL OR br.is_deleted = false)
    ORDER BY br.request_date DESC
  `, [distributorId]);
  const requests = requestsRes.rows;

  // Build result: for each drug, show batches, batch quantities, and requests
  const result = drugs.map(drug => {
    // Find batches for this drug
    const drugBatches = batches.filter(b => b.drugid === drug.id);
    // Find requests for this drug
    const drugRequests = requests.filter(r => r.drug_id === drug.id);
    return {
      drug,
      batches: drugBatches.map(batch => ({
        batch_id: batch.id,
        batchnumber: batch.batchnumber,
        quantity: batch.quantity,
        expirydate: batch.expirydate,
        status: batch.status
      })),
      requests: drugRequests.map(r => ({
        request_id: r.id,
        pharmacist_id: r.pharmacist_id,
        pharmacist_name: r.pharmacist_name,
        batch_id: r.batch_id,
        batchnumber: r.batchnumber,
        quantity_requested: r.quantity_requested,
        status: r.status,
        request_date: r.request_date,
        pharmacist_facility: r.pharmacy_facility_name,
        manufacturer_name: r.manufacturer_company_name
      }))
    };
  });
  return result;
}
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
  // Ensure status is updated for the correct distributor and request
  await query(`UPDATE batch_request SET status = 'approved', approved_date = CURRENT_DATE WHERE id = $1 AND distributor_id = $2`, [requestId, distributorId]);

  // Fetch request details to create shipment
  const reqRes = await query(`SELECT * FROM batch_request WHERE id = $1 AND distributor_id = $2`, [requestId, distributorId]);
  const request = reqRes.rows[0];
  if (request) {
    // Fetch batch details
    const batchRes = await query('SELECT * FROM drugbatch WHERE id = $1', [request.batch_id]);
    const batch = batchRes.rows[0];
    // Create shipment using request and batch info, always set distributor_id
    await createDistributorShipment(distributorId, {
      batch_id: request.batch_id,
      drug_id: request.drug_id || (batch ? batch.drugid : null),
      manufacturer_id: batch ? batch.manufacturerid : null,
      pharmacist_id: request.pharmacist_id,
      quantity_shipped: request.quantity_requested,
      temperature: null,
      route: null,
      vehicle_number: null,
      departure_date: new Date().toISOString(),
  // ...existing code...
    });
  }
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
  // Get all shipments for distributor, with all fields needed by frontend
  const { rows } = await query(`
    SELECT s.*, 
      s.shipmentnumber,
      db.batchnumber, db.drugid,
      d.name AS drugname,
      mc.name AS manufacturer_company_name,
      mf.name AS manufacturer_facility_name,
      pc.name AS pharmacy_company_name,
      pf.name AS pharmacy_facility_name,
      dc.name AS distributorname,
      db.quantity,
      db.expirydate
    FROM shipment s
    JOIN drugbatch db ON db.id = s.batch_id
    LEFT JOIN drug d ON db.drugid = d.id
    LEFT JOIN manufacturer m ON s.manufacturer_id = m.id
    LEFT JOIN manufacturer_company mc ON m.companyid = mc.id
    LEFT JOIN facility mf ON mc.facility_id = mf.id
    LEFT JOIN distributor_company dc ON db.distributorcompanyid = dc.id
    LEFT JOIN pharmacist p ON s.pharmacist_id = p.id
    LEFT JOIN pharmacy_company pc ON p.companyid = pc.id
    LEFT JOIN facility pf ON pc.facility_id = pf.id
    WHERE s.distributor_id = $1
    ORDER BY s.departure_date DESC
  `, [distributorId]);
  return rows;
}
async function createDistributorShipment(distributorId, shipmentData) {
  // Insert new shipment (simplified)
  const { batch_id, drug_id, manufacturer_id, pharmacist_id, quantity_shipped, temperature, route, vehicle_number, departure_date } = shipmentData;
  let final_manufacturer_id = manufacturer_id;
  // Fetch batch details including qrcode_path
  const batchRes = await query('SELECT manufacturerid, qrcode_path FROM drugbatch WHERE id = $1', [batch_id]);
  final_manufacturer_id = final_manufacturer_id || batchRes.rows[0]?.manufacturerid;
  const qrcode_path = batchRes.rows[0]?.qrcode_path || null;
  // Insert shipment with qrcode_path from batch
  await query(`
    INSERT INTO shipment (
      batch_id, drug_id, manufacturer_id, distributor_id, pharmacist_id, quantity_shipped, temperature, route, vehicle_number, departure_date, status, qrcode_path
    ) VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'in_transit'::shipment_status,$11
    )
  `, [
    batch_id,
    drug_id,
    final_manufacturer_id,
    distributorId,
    pharmacist_id,
    quantity_shipped,
    temperature,
    route,
    vehicle_number,
    departure_date,
    qrcode_path
  ]);
  // Subtract shipped quantity from drugbatch
  if (quantity_shipped && batch_id) {
    await query(`UPDATE drugbatch SET quantity = quantity - $1 WHERE id = $2`, [quantity_shipped, batch_id]);
  }
  return true;
}
async function updateDistributorShipmentStatus(distributorId, shipmentId, status) {
  // Update shipment status, arrival_date, received_condition, and updated_at
  let arrival_date = null;
  let received_condition = null;
  if (typeof status === 'object' && status !== null) {
    arrival_date = status.arrival_date || null;
    received_condition = status.received_condition || null;
    status = status.status;
  }
  const allowedStatuses = ['delivered', 'failed', 'flagged'];
  if (!allowedStatuses.includes(status)) {
    throw new Error('Invalid status: Only delivered, failed, or flagged are allowed');
  }
  await query(
    `UPDATE shipment SET status = $1, arrival_date = $2, received_condition = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4 AND distributor_id = $5`,
    [status, arrival_date, received_condition, shipmentId, distributorId]
  );

  // Get batch_id, pharmacist_id, and quantity_shipped from shipment after updating status
  const shipRes = await query('SELECT batch_id, pharmacist_id, quantity_shipped FROM shipment WHERE id = $1', [shipmentId]);
  const batch_id = shipRes.rows[0]?.batch_id;
  const pharmacist_id = shipRes.rows[0]?.pharmacist_id;
  const quantity_shipped = shipRes.rows[0]?.quantity_shipped || 0;
    if (batch_id && pharmacist_id) {
      // Only update batch_request status for valid request_status enums
      // If your request_status enum only allows 'pending', 'approved', 'rejected', skip updating to shipment status values
      // If you want to update batch_request status, map shipment status to valid request_status
      // Otherwise, skip this update to avoid enum errors
      if (status === 'delivered') {
        // Update pharmacy inventory only, do not update batch_request status
        const pharmRes = await query('SELECT companyid FROM pharmacist WHERE id = $1', [pharmacist_id]);
        const pharmacyCompanyId = pharmRes.rows[0]?.companyid;
        if (pharmacyCompanyId) {
          const facilityRes = await query('SELECT facility_id FROM pharmacy_company WHERE id = $1', [pharmacyCompanyId]);
          const pharmacyFacilityId = facilityRes.rows[0]?.facility_id;
          if (pharmacyFacilityId) {
            // Check if inventory row exists
            const invRes = await query('SELECT id FROM inventory WHERE batch_id = $1 AND facility_type = $2 AND facility_id = $3', [batch_id, 'pharmacy', pharmacyFacilityId]);
            if (invRes.rows.length > 0) {
              // Update only available_quantity in the existing inventory row
              await query('UPDATE inventory SET available_quantity = available_quantity + $1, last_updated = CURRENT_TIMESTAMP WHERE id = $2', [quantity_shipped, invRes.rows[0].id]);
            } else {
              // Insert new inventory row only if it does not exist, and include drug_id
              const batchRes = await query('SELECT drugid FROM drugbatch WHERE id = $1', [batch_id]);
              const drug_id = batchRes.rows[0]?.drugid;
              await query('INSERT INTO inventory (batch_id, drug_id, available_quantity, facility_type, facility_id, last_updated) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)', [batch_id, drug_id, quantity_shipped, 'pharmacy', pharmacyFacilityId]);
            }
          }
        }
      }
      // For 'failed' and 'flagged', only update batch_request if those are valid request_status enums
      // Remove invalid enum updates to avoid errors
    }
  return true;
}

// Inventory
async function getDistributorInventory(distributorId) {
  // Get inventory batches and quantities for distributor
  // Join distributor -> drugbatch -> inventory
  const { rows } = await query(`
    SELECT i.id, i.batch_id, db.batchnumber, db.drugid, i.available_quantity
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
  await query(`INSERT INTO inventory (batch_id, available_quantity, facility_type, facility_id) VALUES ($1,$2,'distributor',$3)`, [batch_id, quantity, facilityId]);
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
  // Shipments per region (fix: join facility table via pharmacy_facility_id)
  const shipmentsPerRegion = await query(`
    SELECT pf.name AS region, COUNT(*) AS count
    FROM shipment s
    LEFT JOIN pharmacist p ON s.pharmacist_id = p.id
    LEFT JOIN pharmacy_company pc ON p.companyid = pc.id
    LEFT JOIN facility pf ON pc.facility_id = pf.id
    WHERE s.distributor_id = $1
    GROUP BY pf.name
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

  // Downloadable logistics report (fix: join facility table via pharmacy_facility_id)
  const logisticsReport = await query(`
    SELECT s.*, db.batchnumber, db.drugid, pf.name AS facility
    FROM shipment s
    JOIN drugbatch db ON db.id = s.batch_id
    LEFT JOIN pharmacist p ON s.pharmacist_id = p.id
    LEFT JOIN pharmacy_company pc ON p.companyid = pc.id
    LEFT JOIN facility pf ON pc.facility_id = pf.id
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
  ,getDistributorDrugRequests
};
