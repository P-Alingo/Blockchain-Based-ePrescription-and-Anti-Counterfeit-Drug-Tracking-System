// Delete shipment
async function deleteManufacturerShipment(manufacturerId, shipmentId) {
  // Only allow delete if shipment belongs to manufacturer
  const shipmentResult = await query('SELECT id FROM shipment WHERE id = $1 AND manufacturer_id = $2', [shipmentId, manufacturerId]);
  if (shipmentResult.rowCount === 0) throw new Error('Shipment not found or unauthorized');
  await query('DELETE FROM shipment WHERE id = $1 AND manufacturer_id = $2', [shipmentId, manufacturerId]);
  return true;
}
// Update batch info
async function updateManufacturerBatch(manufacturerId, batchId, updateData) {
  // Only allow update if batch belongs to manufacturer
  const batchResult = await query('SELECT id FROM drugbatch WHERE id = $1 AND manufacturerid = $2', [batchId, manufacturerId]);
  if (batchResult.rowCount === 0) throw new Error('Batch not found or unauthorized');
  // Build dynamic SET clause
  const fields = Object.keys(updateData).filter(k => updateData[k] !== undefined);
  const setClause = fields.map((k, i) => `${k} = $${i + 3}`).join(', ');
  const values = [batchId, manufacturerId, ...fields.map(k => updateData[k])];
  if (!setClause) throw new Error('No fields to update');
  const result = await query(`UPDATE drugbatch SET ${setClause} WHERE id = $1 AND manufacturerid = $2 RETURNING *`, values);
  return result.rows[0];
}

// Delete batch
async function deleteManufacturerBatch(manufacturerId, batchId) {
  // Only allow delete if batch belongs to manufacturer
  const batchResult = await query('SELECT id FROM drugbatch WHERE id = $1 AND manufacturerid = $2', [batchId, manufacturerId]);
  if (batchResult.rowCount === 0) throw new Error('Batch not found or unauthorized');
  await query('DELETE FROM drugbatch WHERE id = $1 AND manufacturerid = $2', [batchId, manufacturerId]);
  return true;
}
import { query } from "../config/database.js";

// Manufacturer Shipments - UPDATED WITH IMPROVED QUERIES
async function getManufacturerShipments(manufacturerId) {
  return (await query(`
    SELECT 
      s.id, 
      s.shipmentnumber, 
      db.batchnumber, 
      d.name AS drug, 
      dc.name AS distributor, 
      s.status, 
      s.departure_date, 
      s.arrival_date, 
      s.route, 
      s.vehicle_number, 
      s.temperature, 
      s.qrcode, 
      s.shipment_type,
      ph.name AS destination_pharmacy,
      s.destination_facility_id
    FROM shipment s
    JOIN drugbatch db ON db.id = s.batch_id
    JOIN drug d ON d.id = s.drug_id
    LEFT JOIN distributor_company dc ON dc.id = db.distributorcompanyid
    LEFT JOIN pharmacy_company ph ON ph.id = s.destination_facility_id
    WHERE s.manufacturer_id = $1
    ORDER BY s.id DESC
  `, [manufacturerId])).rows;
}

async function getManufacturerShipmentDetails(manufacturerId, shipmentId) {
  return (await query(`
    SELECT 
      s.*, 
      db.batchnumber, 
      d.name AS drug, 
      dc.name AS distributor, 
      mc.name AS manufacturer, 
      s.route, 
      s.vehicle_number, 
      s.temperature, 
      s.qrcode,
      ph.name AS destination_pharmacy,
      ph.facility_address AS destination_address,
      ph.facility_phone AS destination_phone
    FROM shipment s
    JOIN drugbatch db ON db.id = s.batch_id
    JOIN drug d ON d.id = s.drug_id
    LEFT JOIN distributor_company dc ON dc.id = db.distributorcompanyid
    LEFT JOIN manufacturer_company mc ON mc.id = s.manufacturer_id
    LEFT JOIN pharmacy_company ph ON ph.id = s.destination_facility_id
    WHERE s.manufacturer_id = $1 AND s.id = $2
    LIMIT 1
  `, [manufacturerId, shipmentId])).rows[0];
}

async function createManufacturerShipment(manufacturerId, data) {
  // Validate required fields
  const { batch_id, drug_id, distributor_id, shipment_type, departure_date, arrival_date, route, vehicle_number, temperature, destination_facility_id, quantity_shipped } = data;
  if (!batch_id || !drug_id || !distributor_id || !shipment_type || !departure_date || !route || !vehicle_number || !quantity_shipped) {
    throw new Error('Missing required shipment fields');
  }

  // Validate batch ownership
  const batchResult = await query('SELECT id FROM drugbatch WHERE id = $1 AND manufacturerid = $2', [batch_id, manufacturerId]);
  if (batchResult.rowCount === 0) {
    throw new Error('Batch does not belong to manufacturer');
  }

  // Generate shipment number
  const shipmentNumber = 'SH-' + Math.floor(100000 + Math.random() * 900000);

  // Generate QR code data (simple string for now)
  const qrData = JSON.stringify({ shipmentNumber, batch_id, manufacturerId, departure_date });
  // You can use a real QR code generator if needed
  const qrcode = qrData;

  // Insert shipment
  const insertResult = await query(`
    INSERT INTO shipment (
      manufacturer_id, batch_id, drug_id, distributor_id, shipmentnumber, shipment_type, departure_date, arrival_date, route, vehicle_number, temperature, qrcode, destination_facility_id, quantity_shipped, status
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,'Pending')
    RETURNING id, shipmentnumber, status, departure_date, arrival_date, route, vehicle_number, temperature, qrcode, shipment_type, destination_facility_id, quantity_shipped
  `, [
    manufacturerId,
    batch_id,
    drug_id,
    distributor_id,
    shipmentNumber,
    shipment_type,
    departure_date,
    arrival_date || null,
    route,
    vehicle_number,
    temperature || null,
    qrcode,
    destination_facility_id || null,
    quantity_shipped
  ]);

  return insertResult.rows[0];
}

async function updateManufacturerShipmentStatus(manufacturerId, shipmentId, status) {
  const validStatuses = ['Pending', 'In Transit', 'Delivered', 'Cancelled'];
  
  if (!validStatuses.includes(status)) {
    throw new Error('Invalid shipment status');
  }
  
  const result = await query(
    'UPDATE shipment SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE manufacturer_id = $2 AND id = $3 RETURNING *',
    [status, manufacturerId, shipmentId]
  );
  
  if (result.rowCount === 0) {
    throw new Error('Shipment not found or does not belong to manufacturer');
  }
  
  return result.rows[0];
}

// Manufacturer Analytics - UPDATED WITH BETTER QUERIES
async function getManufacturerAnalytics(manufacturerId) {
  // Batches Created Over Time (last 12 months)
  const batchesByMonth = await query(`
    SELECT 
      DATE_TRUNC('month', manufacturedate) AS month, 
      COUNT(*) AS count
    FROM drugbatch 
    WHERE manufacturerid = $1 
      AND manufacturedate >= CURRENT_DATE - INTERVAL '12 months'
    GROUP BY month 
    ORDER BY month ASC
  `, [manufacturerId]);

  // Shipment Status Breakdown
  const shipmentStatus = await query(`
    SELECT status, COUNT(*) AS count
    FROM shipment 
    WHERE manufacturer_id = $1
    GROUP BY status
  `, [manufacturerId]);

  // Expiring Soon (30/60/90 days) with drug names
  const expiringSoon = await query(`
    SELECT 
      db.batchnumber, 
      db.expirydate, 
      d.name AS drug_name,
      CASE 
        WHEN db.expirydate <= CURRENT_DATE + INTERVAL '30 days' THEN '30 days'
        WHEN db.expirydate <= CURRENT_DATE + INTERVAL '60 days' THEN '60 days' 
        ELSE '90 days'
      END AS expiry_category
    FROM drugbatch db 
    JOIN drug d ON d.id = db.drugid
    WHERE db.manufacturerid = $1 
      AND db.expirydate BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '90 days'
    ORDER BY db.expirydate ASC
  `, [manufacturerId]);

  // Top Drugs Produced (last 6 months)
  const topDrugs = await query(`
    SELECT 
      d.name, 
      COUNT(*) AS batch_count,
      SUM(db.quantity) AS total_quantity
    FROM drugbatch db 
    JOIN drug d ON db.drugid = d.id
    WHERE db.manufacturerid = $1
      AND db.manufacturedate >= CURRENT_DATE - INTERVAL '6 months'
    GROUP BY d.name 
    ORDER BY batch_count DESC 
    LIMIT 5
  `, [manufacturerId]);

  // Geographic Reach - Updated to handle null distributor companies
  const geoReach = await query(`
    SELECT 
      COALESCE(dc.facility_location, 'Unknown') AS location, 
      COUNT(*) AS count
    FROM drugbatch db 
    LEFT JOIN distributor_company dc ON db.distributorcompanyid = dc.id
    WHERE db.manufacturerid = $1
    GROUP BY dc.facility_location 
    ORDER BY count DESC
  `, [manufacturerId]);

  // Blockchain Performance
  const blockchainPerf = await query(`
    SELECT 
      COALESCE(ev.verified, false) AS verified, 
      COUNT(*) AS count
    FROM drugbatch db 
    LEFT JOIN blockchaineventlog ev ON ev.entityid = db.id
    WHERE db.manufacturerid = $1
    GROUP BY ev.verified
  `, [manufacturerId]);

  // Additional analytics: Recent activity
  const recentActivity = await query(`
    (
      SELECT 
        'batch' as type,
        batchnumber as identifier,
        manufacturedate as date,
        status
      FROM drugbatch 
      WHERE manufacturerid = $1 
      ORDER BY manufacturedate DESC 
      LIMIT 5
    )
    UNION ALL
    (
      SELECT 
        'shipment' as type,
        shipmentnumber as identifier,
        departure_date as date,
        status
      FROM shipment 
      WHERE manufacturer_id = $1 
      ORDER BY departure_date DESC 
      LIMIT 5
    )
    ORDER BY date DESC
    LIMIT 10
  `, [manufacturerId]);

  return {
    batchesByMonth: batchesByMonth.rows,
    shipmentStatus: shipmentStatus.rows,
    expiringSoon: expiringSoon.rows,
    topDrugs: topDrugs.rows,
    geoReach: geoReach.rows,
    blockchainPerf: blockchainPerf.rows,
    recentActivity: recentActivity.rows
  };
}

// Manufacturer Profile Management
async function getManufacturerByUserId(userId) {
  const { rows } = await query(`
    SELECT 
      m.*,
      mc.name as company_name,
      mc.facility as company_facility,
      mc.facility_address,
      mc.facility_phone,
      mc.facility_location,
      u.email,
      u.full_name,
      u.phone_number
    FROM manufacturer m
    JOIN manufacturer_company mc ON mc.id = m.companyid
    JOIN users u ON u.id = m.userid
    WHERE m.userid = $1
  `, [userId]);
  return rows[0] || null;
}

async function updateManufacturerByUserId(userId, updateData) {
  const keys = Object.keys(updateData);
  if (keys.length === 0) return null;
  
  const setClause = keys.map((k, i) => `${k} = $${i + 2}`).join(", ");
  const values = [userId, ...keys.map(k => updateData[k])];
  
  await query(`UPDATE manufacturer SET ${setClause} WHERE userid = $1`, values);
  
  const { rows } = await query("SELECT * FROM manufacturer WHERE userid = $1", [userId]);
  return rows[0] || null;
}

// Manufacturer Batches - IMPLEMENTED PROPERLY
async function getManufacturerBatches(manufacturerId, filters = {}) {
  const { status, drugid, startDate, endDate } = filters;
  
  let whereClause = "WHERE db.manufacturerid = $1";
  const params = [manufacturerId];
  let paramCount = 1;
  
  if (status) {
    paramCount++;
    whereClause += ` AND db.status = $${paramCount}`;
    params.push(status);
  }
  
  if (drugid) {
    paramCount++;
    whereClause += ` AND db.drugid = $${paramCount}`;
    params.push(drugid);
  }
  
  if (startDate) {
    paramCount++;
    whereClause += ` AND db.manufacturedate >= $${paramCount}`;
    params.push(startDate);
  }
  
  if (endDate) {
    paramCount++;
    whereClause += ` AND db.manufacturedate <= $${paramCount}`;
    params.push(endDate);
  }
  
  const sql = `
    SELECT 
      db.id,
      db.batchnumber,
      d.name AS drug_name,
      db.quantity,
      db.manufacturedate,
      db.expirydate,
      db.status,
      db.blockchaintx,
      db.qrcode,
      db.storagetemperature,
      db.manufacturingfacility,
      dc.name AS distributor_name,
      s.shipmentnumber,
      s.status AS shipment_status
    FROM drugbatch db
    JOIN drug d ON d.id = db.drugid
    LEFT JOIN distributor_company dc ON dc.id = db.distributorcompanyid
    LEFT JOIN shipment s ON s.batch_id = db.id
    ${whereClause}
    ORDER BY db.manufacturedate DESC, db.id DESC
  `;
  
  const { rows } = await query(sql, params);
  return rows;
}

async function getManufacturerBatchDetails(manufacturerId, batchId) {
  const { rows } = await query(`
    SELECT 
      db.*,
      d.name AS drug_name,
      d.code AS drug_code,
      d.formulation,
      d.dosageunit,
      mc.name AS manufacturer_company,
      mc.facility AS manufacturer_facility,
      dc.name AS distributor_company,
      dc.facility AS distributor_facility,
      s.shipmentnumber,
      s.status AS shipment_status,
      s.departure_date,
      s.arrival_date,
      qc.fullname AS quality_control_officer
    FROM drugbatch db
    JOIN drug d ON d.id = db.drugid
    JOIN manufacturer_company mc ON mc.id = (SELECT companyid FROM manufacturer WHERE id = db.manufacturerid)
    LEFT JOIN distributor_company dc ON dc.id = db.distributorcompanyid
    LEFT JOIN shipment s ON s.batch_id = db.id
    LEFT JOIN staff qc ON qc.id = db.qualitycontrolofficerid
    WHERE db.id = $1 AND db.manufacturerid = $2
  `, [batchId, manufacturerId]);
  
  return rows[0] || null;
}

// Blockchain functions - IMPLEMENTED PROPERLY
async function getManufacturerBlockchain(manufacturerId, filters = {}) {
  const { batchnumber, blockchaintx } = filters;
  
  let whereClause = "WHERE db.manufacturerid = $1 AND db.blockchaintx IS NOT NULL";
  const params = [manufacturerId];
  let paramCount = 1;
  
  if (batchnumber) {
    paramCount++;
    whereClause += ` AND db.batchnumber = $${paramCount}`;
    params.push(batchnumber);
  }
  
  if (blockchaintx) {
    paramCount++;
    whereClause += ` AND db.blockchaintx = $${paramCount}`;
    params.push(blockchaintx);
  }
  
  const sql = `
    SELECT 
      db.batchnumber,
      db.blockchaintx,
      db.status,
      db.manufacturedate,
      db.expirydate,
      ev.timestamp,
      ev.verified,
      ev.event_type,
      ev.block_number,
      ev.tx_hash
    FROM drugbatch db
    LEFT JOIN blockchaineventlog ev ON ev.entityid = db.id
    ${whereClause}
    ORDER BY ev.timestamp DESC NULLS LAST, db.id DESC
  `;
  
  const { rows } = await query(sql, params);
  return rows;
}

async function getManufacturerBlockchainTx(manufacturerId, txHash) {
  const { rows } = await query(`
    SELECT 
      db.batchnumber,
      db.blockchaintx,
      db.status,
      db.manufacturedate,
      db.expirydate,
      db.qrcode,
      ev.timestamp,
      ev.verified,
      ev.event_type,
      ev.block_number,
      ev.entityid,
      ev.tx_hash,
      s.shipmentnumber,
      s.status AS shipment_status,
      s.departure_date,
      s.arrival_date
    FROM drugbatch db
    LEFT JOIN blockchaineventlog ev ON ev.entityid = db.id AND ev.tx_hash = $2
    LEFT JOIN shipment s ON s.batch_id = db.id
    WHERE db.manufacturerid = $1 AND db.blockchaintx = $2
    LIMIT 1
  `, [manufacturerId, txHash]);
  
  return rows[0] || null;
}

// Create Drug Batch service - IMPLEMENTED
async function createDrugBatch(manufacturerId, batchData) {
  const {
    drugid,
    quantity,
    manufacturedate,
    expirydate,
    storagetemperature,
    distributorcompanyid,
    distributor_facility_id
  } = batchData;
  
  // Get manufacturer company info
  const companyResult = await query(`
    SELECT mc.name, mc.facility 
    FROM manufacturer m
    JOIN manufacturer_company mc ON mc.id = m.companyid
    WHERE m.id = $1
  `, [manufacturerId]);
  
  if (companyResult.rowCount === 0) {
    throw new Error('Manufacturer company not found');
  }
  
  const manufacturerCompany = companyResult.rows[0];
  
  // Generate batch number and blockchain transaction
  const batchnumber = `BATCH-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  const blockchaintx = `0x${Buffer.from(`${batchnumber}-${Date.now()}`).toString('hex')}`;
  
  // Generate QR code
  const qrData = {
    batchnumber,
    drugid,
    manufacturer: manufacturerCompany.name,
    manufacturedate,
    expirydate,
    blockchaintx
  };
  
  // Generate QR code PNG buffer
  const qrBuffer = await QRCode.toBuffer(JSON.stringify(qrData), {
    errorCorrectionLevel: "H",
    width: 400,
    margin: 2,
    color: { dark: "#166534", light: "#FFFFFF" }
  });
  // Save QR code file
  const qrFilename = `batch-${batchnumber}.png`;
  const { url: qrFileUrl } = await import("./fileService.js").then(m => m.saveQRCodeFile(qrBuffer, qrFilename));

  // Insert batch
  const result = await query(`
    INSERT INTO drugbatch (
      manufacturerid, drugid, batchnumber, manufacturedate, expirydate, 
      blockchaintx, qrcode, quantity, storagetemperature, 
      manufacturingfacility, status, distributorcompanyid, distributor_facility_id
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'Pending', $11, $12)
    RETURNING *
  `, [
    manufacturerId, drugid, batchnumber, manufacturedate, expirydate,
    blockchaintx, qrFileUrl, quantity, storagetemperature,
    manufacturerCompany.facility, distributorcompanyid, distributor_facility_id
  ]);
  
  return result.rows[0];
}

  getManufacturerByUserId, 
  updateManufacturerByUserId, 
  createDrugBatch, 
  getManufacturerBatches, 
  getManufacturerBatchDetails, 
  updateManufacturerBatch,
  deleteManufacturerBatch,
  getManufacturerBlockchain, 
  getManufacturerBlockchainTx, 
  getManufacturerAnalytics, 
  getManufacturerShipments, 
  getManufacturerShipmentDetails, 
  createManufacturerShipment, 
  updateManufacturerShipmentStatus,
  deleteManufacturerShipment
export {
  getManufacturerByUserId,
  updateManufacturerByUserId,
  createDrugBatch,
  getManufacturerBatches,
  getManufacturerBatchDetails,
  updateManufacturerBatch,
  deleteManufacturerBatch,
  getManufacturerBlockchain,
  getManufacturerBlockchainTx,
  getManufacturerAnalytics,
  getManufacturerShipments,
  getManufacturerShipmentDetails,
  createManufacturerShipment,
  updateManufacturerShipmentStatus,
  deleteManufacturerShipment
};