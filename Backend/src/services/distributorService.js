import { pool } from '../config/database.js';
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
    // Call DrugSupplyChain contract to log approval (emit BatchTransferred)
    try {
      const { transferBatchOnChain } = await import('./blockchainService.js');
      // You may need to get contractBatchId mapping here
      await transferBatchOnChain({
        batchId: request.batch_id,
        to: request.pharmacist_id, // Should be pharmacist wallet address
        shipmentNumber: `SHIP-${requestId}`,
        status: 'APPROVED'
      });
      console.log('✅ Batch approval logged on-chain');
    } catch (chainErr) {
      console.error('❌ Failed to log batch approval on-chain:', chainErr);
    }
    await createDistributorShipment(distributorId, {
      batch_id: request.batch_id,
      drug_id: request.drug_id,
      manufacturer_id: null,
      pharmacist_id: request.pharmacist_id,
      quantity_shipped: request.quantity_requested,
      temperature: null,
      route: null,
      vehicle_number: null,
      departure_date: new Date().toISOString(),
      request_id: requestId
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
      db.total_batch_quantity as quantity,
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
  // Fetch batch details including qrcode_path
  const { batch_id, drug_id, manufacturer_id, pharmacist_id, quantity_shipped, temperature, route, vehicle_number, departure_date } = shipmentData;
  let final_manufacturer_id = manufacturer_id;
  const batchRes = await query('SELECT manufacturerid, qrcode_path FROM drugbatch WHERE id = $1', [batch_id]);
  final_manufacturer_id = final_manufacturer_id || batchRes.rows[0]?.manufacturerid;
  const qrcode_path = batchRes.rows[0]?.qrcode_path || null;
  // For error notification
  const notifyShipmentError = shipmentData.notifyShipmentError || null;

  // Fetch distributor and pharmacist wallet addresses
  const userId = shipmentData.userId;
  const distributorRes = await query('SELECT wallet_address FROM users WHERE id = $1', [userId]);
  const pharmacistRes = await query('SELECT u.wallet_address FROM pharmacist p JOIN users u ON p.userid = u.id WHERE p.id = $1', [pharmacist_id]);
  const distributorAddress = distributorRes.rows[0]?.wallet_address;
  const pharmacistAddress = pharmacistRes.rows[0]?.wallet_address;

  // Ensure batch exists on-chain by checking drugbatch_ids.json
  let contractBatchId = null;
  try {
    const path = await import('path');
    const fs = await import('fs');
    const batchMapPath = path.resolve(process.cwd(), 'drugbatch_ids.json');
    let batchMappings = [];
    if (fs.existsSync(batchMapPath)) {
      try {
        const fileContent = fs.readFileSync(batchMapPath, 'utf8');
        batchMappings = fileContent ? JSON.parse(fileContent) : [];
      } catch (err) { batchMappings = []; }
    }
    const found = batchMappings.find(m => m.dbDrugBatchId === batch_id);
    if (found && found.contractBatchId) {
      contractBatchId = found.contractBatchId;
    }
  } catch (err) {
    contractBatchId = null;
  }

  if (!contractBatchId) {
    console.warn(`[BLOCKCHAIN] No contract batch mapping found for DB batch ${batch_id}, skipping transfer`);
    throw new Error('Batch not found on-chain');
  }

  // Blockchain integration: create shipment on chain and save mapping
  let contractShipmentId;
  let shipment = null;
  let shipmentId = null;
  try {
    const { transferBatchOnChain, getDrugSupplyChainContract } = await import('./blockchainService.js');
    if (!distributorAddress || !/^0x[a-fA-F0-9]{40}$/.test(distributorAddress)) {
      const errMsg = `[BLOCKCHAIN] Distributor wallet address missing or invalid for distributorId=${distributorId}: ${distributorAddress}`;
      console.error(errMsg);
      if (notifyShipmentError) notifyShipmentError({ error: errMsg, shipmentData });
      throw new Error('Distributor wallet address missing or invalid');
    }
    if (!pharmacistAddress || !/^0x[a-fA-F0-9]{40}$/.test(pharmacistAddress)) {
      const errMsg = `[BLOCKCHAIN] Pharmacist wallet address missing or invalid for pharmacistId=${pharmacist_id}: ${pharmacistAddress}`;
      console.error(errMsg);
      if (notifyShipmentError) notifyShipmentError({ error: errMsg, shipmentData });
      throw new Error('Pharmacist wallet address missing or invalid');
    }
    console.log(`[DEBUG] createDistributorShipment: userId=${userId}, distributorId=${distributorId}, distributorAddress=${distributorAddress}`);
    // Always set a unique, non-empty shipmentNumber
    const shipmentNumber = shipmentData.shipmentNumber && shipmentData.shipmentNumber.trim() ? shipmentData.shipmentNumber.trim() : `SHIP-${Math.floor(Math.random() * 100000)}`;

    // Validate batchId
    const batchId = Number(contractBatchId);
    if (!batchId || isNaN(batchId)) {
      const errMsg = 'Missing or invalid batchId';
      console.error(errMsg, { batchId, shipmentData });
      if (notifyShipmentError) notifyShipmentError({ error: errMsg, shipmentData });
      throw new Error(errMsg);
    }

    // 1. Insert into DB first to get shipmentId
    const shipmentInsert = await query(`
      INSERT INTO shipment (
        batch_id, drug_id, manufacturer_id, distributor_id, pharmacist_id, quantity_shipped, temperature, route, vehicle_number, departure_date, status, qrcode_path
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'in_transit'::shipment_status,$11
      )
      RETURNING *
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
    shipment = shipmentInsert.rows[0];
    shipmentId = shipment.id;

    // 2. Call contract with DB shipmentId
    // Use contract instance from config/blockchain.js
    const tx = await drugSupplyChainContract.createShipment(
      shipmentId,
      batchId,
      distributorAddress,
      pharmacistAddress,
      'in_transit'
    );
    const receipt = await tx.wait();
    // Extract contractShipmentId from event logs
    contractShipmentId = null;
    if (receipt && receipt.events) {
      const event = receipt.events.find(e => e.event === "ShipmentCreated");
      if (event && event.args && event.args.shipmentId) {
        contractShipmentId = event.args.shipmentId.toString();
      }
    }
    // Verify shipment exists on-chain
    const onChainShipment = await drugSupplyChainContract.shipments(shipmentId);
    if (!onChainShipment || !onChainShipment.shipmentId || Number(onChainShipment.shipmentId) !== shipmentId) {
      const errMsg = `[BLOCKCHAIN] ShipmentId ${shipmentId} not found on-chain after creation.`;
      console.error(errMsg, { shipmentId, shipmentData });
      if (notifyShipmentError) notifyShipmentError({ error: errMsg, shipmentData });
      throw new Error('Shipment creation failed on-chain (not found after creation)');
    }
    // 3. Update shipment_id.json mapping file
    try {
      const pathMod = await import('path');
      const fsMod = await import('fs');
      const mappingFile = pathMod.resolve(process.cwd(), 'shipment_id.json');
      let mappings = [];
      if (fsMod.existsSync(mappingFile)) {
        const fileContent = fsMod.readFileSync(mappingFile, 'utf8');
        try {
          mappings = JSON.parse(fileContent);
        } catch (e) {
          console.error('[ERROR] Failed to parse shipment_id.json:', e);
          mappings = [];
        }
      }
      const mappingToWrite = {
        databaseShipmentId: shipmentId,
        contractShipmentId: contractShipmentId
      };
      mappings.push(mappingToWrite);
      try {
        fsMod.writeFileSync(mappingFile, JSON.stringify(mappings, null, 2));
        console.log('✅ Shipment mapping written:', mappingToWrite);
      } catch (writeErr) {
        console.error('[ERROR] Failed to write shipment_id.json:', writeErr);
        throw new Error('Failed to write shipment mapping file. Check file permissions and path.');
      }
    } catch (err) {
      console.error('❌ Failed to update shipment_id.json:', err);
      throw new Error('Failed to update shipment mapping file.');
    }
  } catch (chainError) {
    console.error('❌ Blockchain batch transfer failed:', chainError, { shipmentData });
    if (notifyShipmentError) notifyShipmentError({ error: chainError?.message || chainError, shipmentData, stack: chainError?.stack });
    throw new Error('Shipment creation failed on-chain');
  }

  // Update batch_request status to 'in_transit' and log on-chain
  const { request_id } = shipmentData;
  if (request_id && shipment) {
    const { updateBatchRequestStatus } = await import('./pharmacistService.js');
    await updateBatchRequestStatus(request_id, 'in_transit', { distributorId, batch_id, shipmentId: shipment.id });
  }

  // Do NOT subtract shipped quantity from drugbatch here; subtraction will occur when shipment is marked 'completed'.

  // Ensure shipment is always defined and returned
  if (!shipment) {
    throw new Error('Shipment DB insert failed, shipment is undefined');
  }
  return shipment;
}

async function updateDistributorShipmentStatus(distributorId, shipmentId, status) {
  // pool is imported at the top as ES module
  const client = await pool.connect();
  try {
    // Set session variable for audit triggers (must be userId)
    const userId = arguments[3];
    await client.query(`SET app.current_user_id = '${userId}'`);

    // Prepare status, arrival_date, received_condition
    let arrival_date = null;
    let received_condition = null;
    if (typeof status === 'object' && status !== null) {
      arrival_date = status.arrival_date || null;
      received_condition = status.received_condition || null;
      status = status.status;
    }
    // Get batch_id and shipmentNumber for blockchain update
    const shipRes = await client.query('SELECT * FROM shipment WHERE id = $1', [shipmentId]);
    const shipmentNumber = shipRes.rows[0]?.shipmentnumber || `SHIP-${shipmentId}`;
    const batch_id = shipRes.rows[0]?.batch_id;
    const pharmacist_id = shipRes.rows[0]?.pharmacist_id;
    const quantity_shipped = shipRes.rows[0]?.quantity_shipped;

    // On-chain shipment status update
    try {
      // Use contract instance from config/blockchain.js
      await drugSupplyChainContract.updateDistributorShipmentStatus(shipmentId, status);
    } catch (err) {
      console.error('❌ Failed to update shipment status on-chain:', err);
      throw new Error('Failed to update shipment status on-chain');
    }

    // If status is flagged, set violator to manufacturer user ID
    let violatorUserId = null;
    if (status === 'flagged') {
      // Get manufacturer_id from shipment table directly
      const shipRes2 = await client.query('SELECT manufacturer_id FROM shipment WHERE id = $1', [shipmentId]);
      const manufacturerId = shipRes2.rows[0]?.manufacturer_id;
      if (manufacturerId) {
        // Get user ID for manufacturer
        const manuUserRes = await client.query('SELECT userid FROM manufacturer WHERE id = $1', [manufacturerId]);
        violatorUserId = manuUserRes.rows[0]?.userid || null;
      }
    }
    // Update shipment status, updated_by, and violator in DB (atomic)
    await client.query(
      `UPDATE shipment SET status = $1, arrival_date = $2, received_condition = $3, updated_by = $4${status === 'flagged' ? ', violator = $6' : ''} WHERE id = $5`,
      status === 'flagged'
        ? [status, arrival_date ?? null, received_condition ?? null, userId, shipmentId, violatorUserId]
        : [status, arrival_date ?? null, received_condition ?? null, userId, shipmentId]
    );

      // If status is flagged, call RegulatorOversight contract to log flag event
      if (status === 'flagged') {
        try {
          const { flagEntityOnChain } = await import('../services/blockchainService.js');
          // Use admin wallet for regulator actions
          const regulatorAddress = process.env.ADMIN_WALLET_ADDRESS;
          await flagEntityOnChain({
            entityType: 'shipment',
            entityId: shipmentId,
            userAddress: regulatorAddress,
            reason: received_condition || 'Flagged by distributor',
          });
        } catch (err) {
          console.error('❌ Failed to call RegulatorOversight.flagEntity:', err);
        }
      }
    // Subtract shipped quantity from drugbatch ONLY if status is 'completed'
    if (status === 'completed' && quantity_shipped && batch_id) {
      await client.query(`UPDATE drugbatch SET total_batch_quantity = total_batch_quantity - $1 WHERE id = $2`, [quantity_shipped, batch_id]);
    }

    return true;
  } finally {
    client.release();
  }
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
import { drugSupplyChainContract } from "../config/blockchain.js";
import { getContractBatchId } from "../utils/blockchainMappings.js";


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
  getDistributorBlockchain,
  getDistributorAnalytics,
  getDistributorDrugRequests
};
