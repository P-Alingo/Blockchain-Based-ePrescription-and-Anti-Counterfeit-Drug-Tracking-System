// Centralized shipment status update with blockchain logging
async function updateShipmentStatusWithAudit(shipmentId, manufacturerId, newStatus, extra = {}) {
  // Update status in DB
  await query(
    `UPDATE shipment SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND manufacturer_id = $3`,
    [newStatus, shipmentId, manufacturerId]
  );

  // Blockchain event logging for shipment status change
  try {
    const { logAuditOnChain } = await import("../services/blockchainService.js");
    const auditResult = await logAuditOnChain({
      description: `Shipment status changed to '${newStatus}' for shipmentId=${shipmentId}, manufacturerId=${manufacturerId}`,
      entityType: "shipment",
      entityId: shipmentId
    });
    // Save blockchain event to blockchaineventlog
    const eventType = `shipment_status_${newStatus}`;
    const txHash = auditResult?.transactionHash || auditResult?.txHash || null;
    await query(
      `INSERT INTO blockchaineventlog (eventtype, entitytype, entityid, transactionhash, timestamp) VALUES ($1, $2, $3, $4, NOW())`,
      [eventType, "shipment", shipmentId, txHash]
    );
  } catch (chainErr) {
    console.warn("Blockchain shipment status event failed:", chainErr);
  }
}
import { query } from "../config/database.js";
import QRCode from 'qrcode';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { drugSupplyChainContract } from "../config/blockchain.js";
// If you need other contracts, import them similarly

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper function to save QR code files
async function saveQRCodeFile(qrBuffer, filename) {
  try {
    const uploadsDir = path.join(__dirname, '..', '..', 'uploads', 'qrcodes');
    await fs.mkdir(uploadsDir, { recursive: true });
    
    const filePath = path.join(uploadsDir, filename);
    await fs.writeFile(filePath, qrBuffer);
    
    return { url: `/uploads/qrcodes/${filename}` };
  } catch (error) {
    console.error('Error saving QR code file:', error);
    throw new Error('Failed to save QR code file');
  }
}

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
  const batchResult = await query('SELECT * FROM drugbatch WHERE id = $1 AND manufacturerid = $2', [batchId, manufacturerId]);
  if (batchResult.rowCount === 0) throw new Error('Batch not found or unauthorized');
  // Build dynamic SET clause
  const fields = Object.keys(updateData).filter(k => updateData[k] !== undefined);
  const setClause = fields.map((k, i) => `${k} = $${i + 3}`).join(', ');
  const values = [batchId, manufacturerId, ...fields.map(k => updateData[k])];
  if (!setClause) throw new Error('No fields to update');
  const result = await query(`UPDATE drugbatch SET ${setClause} WHERE id = $1 AND manufacturerid = $2 RETURNING *`, values);
  const batch = result.rows[0];
  // On-chain logging using contract batch ID and event log
  let mappingError = null;
  try {
    const pathMod = await import('path');
    const fsMod = await import('fs');
    const mappingFile = pathMod.resolve(__dirname, '../../drugbatch_ids.json');
    let contractBatchId = null;
    let mappings = [];
    if (fsMod.existsSync(mappingFile)) {
      const fileContent = fsMod.readFileSync(mappingFile, 'utf8');
      try {
        mappings = JSON.parse(fileContent);
        // Handle type mismatch: compare as string
        const found = mappings.find(m => String(m.dbDrugBatchId) === String(batch.id));
        if (found && found.contractBatchId !== undefined && found.contractBatchId !== null && found.contractBatchId !== "") {
          contractBatchId = found.contractBatchId;
        }
      } catch (e) {
        console.error('[Service] Error parsing mapping file:', e);
      }
    }
    if (contractBatchId !== null && contractBatchId !== undefined && contractBatchId !== "") {
      // Use contract instance from config/blockchain.js
      try {
        const tx = await drugSupplyChainContract.editDrugBatch(
          contractBatchId,
          batch.manufacturerid,
          batch.drugid,
          batch.batchnumber,
          Math.floor(new Date(batch.manufacturedate).getTime() / 1000),
          Math.floor(new Date(batch.expirydate).getTime() / 1000),
          batch.total_batch_quantity,
          batch.storagetemperature || "",
          batch.manufacturingfacility || "",
          batch.qualitycontrolofficerid || 0,
          batch.datechecked ? Math.floor(new Date(batch.datechecked).getTime() / 1000) : 0
        );
        const receipt = await tx.wait();
        const txHash = receipt?.transactionHash || tx?.hash;
        // Log event in blockchaineventlog
        try {
          await query(
            `INSERT INTO blockchaineventlog (eventname, contractname, entityid, entitytype, transactionhash, timestamp) VALUES ($1, $2, $3, $4, $5, NOW())`,
            [
              'drugbatch_edited',
              'DrugSupplyChain',
              batch.id,
              'drugbatch',
              txHash
            ]
          );
        } catch (logErr) {
          console.warn('DrugBatch edit event log failed:', logErr);
        }
      } catch (contractErr) {
        console.error('DrugBatch on-chain edit failed:', contractErr);
      }
    } else {
      mappingError = `No contract batch mapping found for DB batch ${batch.id}. Cannot edit on-chain. Please ensure batch is created on-chain and mapping exists.`;
      console.error(`[Service] ${mappingError}`);
    }
  } catch (err) {
    console.error("DrugBatch on-chain edit mapping logic failed:", err);
  }
  // Return mappingError so controller can notify frontend
  if (mappingError) {
    return { mappingError };
  }
  return batch;
}

// Delete batch
async function deleteManufacturerBatch(manufacturerId, batchId) {
  console.log(`🗑️ [Service] Attempting to delete batch ${batchId} for manufacturer ${manufacturerId}`);
  // Only allow delete if batch belongs to manufacturer
  const batchResult = await query('SELECT * FROM drugbatch WHERE id = $1 AND manufacturerid = $2', [batchId, manufacturerId]);
  console.log(`[Service] Batch lookup result:`, batchResult.rows);
  if (batchResult.rowCount === 0) {
    console.error(`[Service] Batch ${batchId} not found for manufacturer ${manufacturerId}`);
    throw new Error(`Batch not found for manufacturer`);
  }
  const deleteResult = await query('DELETE FROM drugbatch WHERE id = $1 AND manufacturerid = $2', [batchId, manufacturerId]);
  console.log(`[Service] Delete query result:`, deleteResult);
  // On-chain delete and mapping cleanup
  try {
    const pathMod = await import('path');
    const fsMod = await import('fs');
    const mappingFile = pathMod.resolve(__dirname, '../../drugbatch_ids.json');
    let contractBatchId = null;
    let mappings = [];
    if (fsMod.existsSync(mappingFile)) {
      const fileContent = fsMod.readFileSync(mappingFile, 'utf8');
      try {
        mappings = JSON.parse(fileContent);
        // Handle type mismatch: compare as string
        const found = mappings.find(m => String(m.dbDrugBatchId) === String(batchId));
        if (found && found.contractBatchId !== undefined && found.contractBatchId !== null && found.contractBatchId !== "") {
          contractBatchId = found.contractBatchId;
        }
      } catch (e) {
        console.error('[Service] Error parsing mapping file:', e);
      }
    }
    if (contractBatchId !== null && contractBatchId !== undefined && contractBatchId !== "") {
      await drugSupplyChainContract.deleteDrugBatch(contractBatchId);
      console.log(`[Service] On-chain batch delete called for contractBatchId ${contractBatchId}`);
    } else {
      console.log(`[Service] No contract batch mapping found for DB batch ${batchId}, skipping on-chain delete.`);
    }
    // Always remove mapping for this batchId
    const updatedMappings = mappings.filter(m => m.dbDrugBatchId !== batchId);
    fsMod.writeFileSync(mappingFile, JSON.stringify(updatedMappings, null, 2));
    console.log(`[Service] Removed batch ${batchId} from drugbatch_ids.json mapping file.`);
  } catch (err) {
    console.error("DrugBatch on-chain delete/mapping cleanup failed:", err);
  }
  return true;
}

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
      s.quantity_shipped,
      s.route, 
      s.vehicle_number, 
      s.temperature, 
      s.qrcode_path
    FROM shipment s
    JOIN drugbatch db ON db.id = s.batch_id
    JOIN drug d ON d.id = s.drug_id
    LEFT JOIN distributor_company dc ON dc.id = db.distributorcompanyid
    WHERE s.manufacturer_id = $1
    ORDER BY s.id DESC
  `, [manufacturerId])).rows;
}

async function getManufacturerShipmentDetails(manufacturerId, shipmentId) {
  const result = await query(`
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
  -- Removed join on destination_facility_id
    WHERE s.manufacturer_id = $1 AND s.id = $2
    LIMIT 1
  `, [manufacturerId, shipmentId]);
  
  return result.rows[0] || null;
}

async function createManufacturerShipment(manufacturerId, data) {
  // Validate required fields
  const { batch_id, drug_id, distributor_id, shipment_type, departure_date, arrival_date, route, vehicle_number, temperature, quantity_shipped } = data;
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

  // --- ATOMIC ON-CHAIN CREATION ---
  let contractShipmentId = null;
  try {
    // Call contract to create shipment on-chain using config/blockchain.js instance
    const tx = await drugSupplyChainContract.createShipment(
      shipmentNumber,
      batch_id,
      drug_id,
      distributor_id,
      manufacturerId,
      shipment_type,
      Math.floor(new Date(departure_date).getTime() / 1000),
      arrival_date ? Math.floor(new Date(arrival_date).getTime() / 1000) : 0,
      route,
      vehicle_number,
      temperature || '',
      Number(quantity_shipped),
      qrcode
    );
    const receipt = await tx.wait();
    // Extract contract shipmentId from event
    const shipmentCreatedEvent = receipt.events?.find(ev => ev.event === 'ShipmentCreated');
    contractShipmentId = shipmentCreatedEvent?.args?.shipmentId?.toString();
    if (!contractShipmentId) throw new Error('No shipmentId returned from contract');
  } catch (err) {
    // If contract call fails, do NOT update DB or mapping
    console.error('❌ Failed to create shipment on-chain:', err);
    throw new Error('Failed to create shipment on-chain: ' + err.message);
  }

  // Only insert into DB and update mapping after contract confirmation
  const insertResult = await query(`
    INSERT INTO shipment (
      manufacturer_id, batch_id, drug_id, distributor_id, shipmentnumber, shipment_type, departure_date, arrival_date, route, vehicle_number, temperature, qrcode, quantity_shipped, status
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,'pending')
    RETURNING id, shipmentnumber, status, departure_date, arrival_date, route, vehicle_number, temperature, qrcode, shipment_type, quantity_shipped
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
    quantity_shipped
  ]);

  // Update shipment mapping file
  try {
    const pathMod = await import('path');
    const fsMod = await import('fs');
    const mappingFile = pathMod.resolve(__dirname, '../../shipment_id.json');
    let mappings = [];
    if (fsMod.existsSync(mappingFile)) {
      const fileContent = fsMod.readFileSync(mappingFile, 'utf8');
      try {
        mappings = JSON.parse(fileContent);
      } catch (e) {
        mappings = [];
      }
    }
    const mappingToWrite = {
      dbShipmentId: insertResult.rows[0].id,
      contractShipmentId: contractShipmentId
    };
    mappings.push(mappingToWrite);
    fsMod.writeFileSync(mappingFile, JSON.stringify(mappings, null, 2));
    console.log('✅ Shipment mapping written:', mappingToWrite);
  } catch (err) {
    console.error('❌ Failed to update shipment_id.json:', err);
  }

  return insertResult.rows[0];
}

async function updateManufacturerShipmentStatus(manufacturerId, shipmentId, status) {
  const validStatuses = ['pending', 'in_transit', 'delivered', 'cancelled'];
  
  if (!validStatuses.includes(status)) {
    throw new Error('Invalid shipment status');
  }
  
    // Update shipment status and log blockchain event
    await updateShipmentStatusWithAudit(shipmentId, manufacturerId, status, { manufacturerId, shipmentId, status });

    // ...existing code for analytics, etc...
}

 // Manufacturer Analytics - FIXED QUERIES
async function getManufacturerAnalytics(manufacturerId) {
  try {
    console.log('📊 Fetching analytics for manufacturer:', manufacturerId);

    // 1. Batches by month - FIXED: Check if we have any batches first
    const batchesByMonth = await query(`
      SELECT 
        TO_CHAR(manufacturedate, 'YYYY-MM') as month,
        COUNT(*) as count
      FROM drugbatch 
      WHERE manufacturerid = $1 
        AND manufacturedate >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY TO_CHAR(manufacturedate, 'YYYY-MM')
      ORDER BY month ASC
    `, [manufacturerId]);

    console.log('📅 Batches by month:', batchesByMonth.rows);

    // 2. Shipment status breakdown - FIXED: Remove invalid enum value
    const shipmentStatus = await query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM shipment 
      WHERE manufacturer_id = $1
      GROUP BY status
      ORDER BY count DESC
    `, [manufacturerId]);

    console.log('🚚 Shipment status:', shipmentStatus.rows);

    // 3. Batches expiring soon (next 90 days) - FIXED: Include drug name
    const expiringSoon = await query(`
      SELECT 
        db.batchnumber,
        TO_CHAR(db.expirydate, 'YYYY-MM-DD') as expirydate,
        d.name as drug_name
      FROM drugbatch db
      LEFT JOIN drug d ON d.id = db.drugid
      WHERE db.manufacturerid = $1 
        AND db.expirydate BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '90 days'
      ORDER BY db.expirydate ASC
      LIMIT 10
    `, [manufacturerId]);

    console.log('⏰ Expiring soon:', expiringSoon.rows);

    // 4. Top drugs produced - FIXED: Ensure we get results
    const topDrugs = await query(`
      SELECT 
        COALESCE(d.name, 'Unknown Drug') as name,
        COUNT(db.id) as count,
        SUM(db.total_batch_quantity) as total_quantity
      FROM drugbatch db
      LEFT JOIN drug d ON d.id = db.drugid
      WHERE db.manufacturerid = $1
      GROUP BY d.name
      ORDER BY count DESC
      LIMIT 10
    `, [manufacturerId]);

    console.log('💊 Top drugs:', topDrugs.rows);

    // 5. Geographic reach - FIXED: Correct joins and WHERE clause
    const geoReach = await query(`
      SELECT 
        COALESCE(f.location, dc.name, 'Unknown Location') AS facility_location,
        COUNT(s.id) AS count
      FROM shipment s
      LEFT JOIN distributor_company dc ON s.distributor_id = dc.id
      LEFT JOIN facility f ON dc.facility_id = f.id
      WHERE s.manufacturer_id = $1
      GROUP BY f.location, dc.name
      ORDER BY count DESC
      LIMIT 10
    `, [manufacturerId]);

    console.log('🌍 Geographic reach:', geoReach.rows);

    // 6. Blockchain performance - FIXED: Use correct column 'processed'
    const blockchainPerf = await query(`
      SELECT 
        COALESCE(ev.processed, false) as processed,
        COUNT(*) as count
      FROM drugbatch db
      LEFT JOIN blockchaineventlog ev ON ev.entityid = db.id
      WHERE db.manufacturerid = $1 
      GROUP BY COALESCE(ev.processed, false)
      ORDER BY processed
    `, [manufacturerId]);

    console.log('⛓️ Blockchain performance:', blockchainPerf.rows);

    // 7. Additional metrics for summary - FIXED: Handle division by zero
    const totalBatches = await query(
      "SELECT COUNT(*) as count FROM drugbatch WHERE manufacturerid = $1", 
      [manufacturerId]
    );
    
    const totalShipments = await query(
      "SELECT COUNT(*) as count FROM shipment WHERE manufacturer_id = $1", 
      [manufacturerId]
    );
    
    // Calculate qualityPassRate as percent of batches with a quality officer assigned
    const qualityCheckedResult = await query(
      'SELECT COUNT(*) FROM drugbatch WHERE manufacturerid = $1 AND qualitycontrolofficerid IS NOT NULL',
      [manufacturerId]
    );
    const qualityChecked = parseInt(qualityCheckedResult.rows[0].count, 10);
    const totalBatchesCount = parseInt(totalBatches.rows[0]?.count) || 0;

    const analyticsData = {
      batchesByMonth: batchesByMonth.rows,
      shipmentStatus: shipmentStatus.rows,
      expiringSoon: expiringSoon.rows,
      topDrugs: topDrugs.rows,
      geoReach: geoReach.rows,
      blockchainPerf: blockchainPerf.rows,
      summary: {
        totalBatches: totalBatchesCount,
        totalShipments: parseInt(totalShipments.rows[0]?.count) || 0,
        qualityPassRate: totalBatchesCount > 0 ? (qualityChecked / totalBatchesCount) * 100 : 0
      }
    };

    console.log('✅ Analytics data fetched successfully:', {
      batches: analyticsData.batchesByMonth.length,
      shipments: analyticsData.shipmentStatus.length,
      expiring: analyticsData.expiringSoon.length,
      topDrugs: analyticsData.topDrugs.length,
      geo: analyticsData.geoReach.length,
      blockchain: analyticsData.blockchainPerf.length,
      summary: analyticsData.summary
    });

    return analyticsData;

  } catch (error) {
    console.error('❌ Error in getManufacturerAnalytics service:', error);
    throw error;
  }
}

// Sample data for testing when database is empty
function getSampleAnalyticsData() {
  console.log('📋 Returning sample analytics data for testing');
  
  const months = [];
  for (let i = 11; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    months.push(date.toISOString().slice(0, 7));
  }

  return {
    batchesByMonth: months.map(month => ({
      month,
      count: Math.floor(Math.random() * 10) + 1
    })),
    shipmentStatus: [
      { status: 'pending', count: 5 },
      { status: 'in_transit', count: 3 },
      { status: 'delivered', count: 12 }
    ],
    expiringSoon: [
      { batchnumber: 'BATCH-001', expirydate: '2024-03-15', drug_name: 'Paracetamol' },
      { batchnumber: 'BATCH-002', expirydate: '2024-03-20', drug_name: 'Amoxicillin' }
    ],
    topDrugs: [
      { name: 'Paracetamol', count: 15, total_quantity: 15000 },
      { name: 'Amoxicillin', count: 12, total_quantity: 12000 },
      { name: 'Ibuprofen', count: 8, total_quantity: 8000 }
    ],
    geoReach: [
      { facility_location: 'Nairobi', count: 8 },
      { facility_location: 'Mombasa', count: 5 },
      { facility_location: 'Kisumu', count: 3 }
    ],
    blockchainPerf: [
      { verified: true, count: 18 },
      { verified: false, count: 2 }
    ],
    summary: {
      totalBatches: 25,
      totalShipments: 20,
      qualityPassRate: 85.5
    }
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
      db.total_batch_quantity as quantity,
      db.manufacturedate,
      db.expirydate,
      db.blockchaintx,
      db.qrcode_path,
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
async function deleteManufacturerBatchMapping(batchId) {
  try {
    const pathMod = await import('path');
    const fsMod = await import('fs');
    const mappingFile = pathMod.resolve(__dirname, '../../drugbatch_ids.json');
    let contractBatchId = null;
    let mappings = [];
    if (fsMod.existsSync(mappingFile)) {
      const fileContent = fsMod.readFileSync(mappingFile, 'utf8');
      try {
        mappings = JSON.parse(fileContent);
        const found = mappings.find(m => m.dbDrugBatchId === batchId);
        if (found && found.contractBatchId) contractBatchId = found.contractBatchId;
      } catch (e) {}
    }
    if (contractBatchId) {
      await drugSupplyChainContract.deleteDrugBatch(contractBatchId);
    } else {
      console.log(`[Service] No contract batch mapping found for DB batch ${batchId}, skipping on-chain delete.`);
    }
    // Always remove mapping for this batchId
    const updatedMappings = mappings.filter(m => m.dbDrugBatchId !== batchId);
    fsMod.writeFileSync(mappingFile, JSON.stringify(updatedMappings, null, 2));
    console.log(`[Service] Removed batch ${batchId} from drugbatch_ids.json mapping file.`);
  } catch (err) {
    console.error("DrugBatch on-chain delete/mapping cleanup failed:", err);
  }
}
  
async function getManufacturerBlockchainTx(manufacturerId, txHash) {
  const { rows } = await query(`
    SELECT 
      db.batchnumber,
      db.blockchaintx,
      db.status,
      db.manufacturedate,
      db.expirydate,
      db.qrcode_path,
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

async function createDrugBatch(manufacturerId, batchData) {
  const {
    drugid,
    manufacturedate,
    expirydate,
    total_batch_quantity,
    storagetemperature,
    manufacturingfacility,
    distributorcompanyid,
    distributor_facility_id,
    qualitycontrolofficerid
  } = batchData;

  if (!drugid) throw new Error('drugid is required');
  if (!manufacturedate || !expirydate) throw new Error('manufacturedate and expirydate are required');
  if (!total_batch_quantity) throw new Error('total_batch_quantity is required');

  const manufacturerResult = await query(`
    SELECT m.id, mc.name AS company_name, f.name AS facility_name, u.wallet_address
    FROM manufacturer m
    JOIN manufacturer_company mc ON mc.id = m.companyid
    JOIN facility f ON mc.facility_id = f.id
    JOIN users u ON u.id = m.userid
    WHERE m.id = $1
  `, [manufacturerId]);
  if (manufacturerResult.rowCount === 0) {
    throw new Error('Manufacturer profile not found');
  }
  const manufacturerCompany = manufacturerResult.rows[0];

  const drugResult = await query('SELECT name FROM drug WHERE id = $1', [drugid]);
  const drugName = drugResult.rows[0]?.name || 'Unknown Drug';

  const batchnumber = `BATCH-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
  const qrData = {
    batchnumber,
    drugid,
    manufacturer: manufacturerCompany.company_name,
    manufacturedate,
    expirydate,
    total_batch_quantity
  };
  
  let qrcodePath = null;
  try {
    const qrBuffer = await QRCode.toBuffer(JSON.stringify(qrData), {
      errorCorrectionLevel: "H",
      width: 400,
      margin: 2,
      color: { dark: "#166534", light: "#FFFFFF" }
    });
    const qrFilename = `batch-${batchnumber}-${Date.now()}.png`;
    const { url } = await saveQRCodeFile(qrBuffer, qrFilename);
    qrcodePath = url;
  } catch (err) {
    console.warn('⚠️ QR code generation failed, continuing without image', err);
  }

  // --- ATOMIC CREATION: DB FIRST, THEN ON-CHAIN ---
  // 1. Insert batch into DB to get databaseId
  const insertResult = await query(`
    INSERT INTO drugbatch (
      manufacturerid, drugid, batchnumber, manufacturedate, expirydate, 
      qrcode_path, total_batch_quantity, storagetemperature, manufacturingfacility,
      distributorcompanyid, distributor_facility_id, qualitycontrolofficerid
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
    RETURNING *
  `, [
    manufacturerId, 
    drugid, 
    batchnumber, 
    manufacturedate, 
    expirydate,
    qrcodePath, 
    total_batch_quantity, 
    storagetemperature || null,
    manufacturingfacility || manufacturerCompany.facility_name,
    distributorcompanyid || null,
    distributor_facility_id || null,
    qualitycontrolofficerid || null
  ]);
  const batch = insertResult.rows[0];

  // 2. Call contract with databaseId using drugSupplyChainContract
  let contractBatchId = null;
  let batchCreatedEvent = null;
  try {
    const tx = await drugSupplyChainContract.createDrugBatch(
      batch.id, // uint batchId
      manufacturerId, // uint manufacturerId
      drugid, // uint drugId
      batchnumber, // string batchNumber
      Math.floor(new Date(manufacturedate).getTime() / 1000), // uint manufactureDate
      Math.floor(new Date(expirydate).getTime() / 1000), // uint expiryDate
      Number(batch.total_batch_quantity), // uint quantity
      storagetemperature || '', // string storageTemperature
      manufacturingfacility || manufacturerCompany.facility_name, // string manufacturingFacility
      qualitycontrolofficerid || 0, // uint qualityControlOfficerId
      Math.floor(Date.now() / 1000) // uint dateChecked
    );
    const receipt = await tx.wait();
    batchCreatedEvent = receipt.events?.find(ev => ev.event === 'DrugBatchCreated');
    contractBatchId = batchCreatedEvent?.args?.batchId?.toString();
    if (!contractBatchId) throw new Error('No batchId returned from contract');
  } catch (err) {
    // If contract call fails, do NOT update mapping
    console.error('❌ Failed to create batch on-chain:', err);
    throw new Error('Failed to create batch on-chain: ' + err.message);
  }

  // 3. Update batch mapping file only after contract confirmation
  try {
    const pathMod = await import('path');
    const fsMod = await import('fs');
    const mappingFile = pathMod.resolve(__dirname, '../../drugbatch_ids.json');
    let mappings = [];
    if (fsMod.existsSync(mappingFile)) {
      const fileContent = fsMod.readFileSync(mappingFile, 'utf8');
      try {
        mappings = JSON.parse(fileContent);
      } catch (e) {
        mappings = [];
      }
    }
    const mappingToWrite = {
      dbDrugBatchId: batch.id,
      contractBatchId: contractBatchId
    };
    mappings.push(mappingToWrite);
    fsMod.writeFileSync(mappingFile, JSON.stringify(mappings, null, 2));
    console.log('✅ Drug batch mapping written:', mappingToWrite);
  } catch (err) {
    console.error('❌ Failed to update drugbatch_contract_ids.js:', err);
  }

  return batch;
}

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
}