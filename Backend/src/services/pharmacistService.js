// Helper: Check if batch request exists on-chain
import { drugSupplyChainContract } from '../config/blockchain.js';
async function batchRequestExistsOnChain(requestId) {
  try {
    const req = await drugSupplyChainContract.batchRequests(requestId);
    // Solidity default for missing struct: all fields zero/empty
    return req.requestId && req.requestId.toString() === requestId.toString() && !req.isDeleted;
  } catch (err) {
    console.error(`[BatchRequestExists] Error checking batchRequests(${requestId}):`, err);
    return false;
  }
}
import { fileURLToPath } from 'url';
import path from 'path';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Pharmacist-specific shipment status update
export async function updatePharmacistShipmentStatus(pharmacistId, shipmentId, status, extra = {}) {
  // Set session variable for audit triggers
  if (extra && extra.userId) {
    await query(`SET app.current_user_id = '${extra.userId}'`);
  }
  // Update shipment status and updated_by in DB (atomic)
  await query(
    `UPDATE shipment SET status = $1, updated_at = CURRENT_TIMESTAMP, updated_by = $2 WHERE id = $3 AND pharmacist_id = $4`,
    [status, extra.userId, shipmentId, pharmacistId]
  );

  // On-chain shipment status update (DrugSupplyChain contract)
  let txHash = '';
  try {
    const { drugSupplyChainContract } = await import('../config/blockchain.js');
    const tx = await drugSupplyChainContract.updatePharmacistShipmentStatus(shipmentId, status);
    const receipt = await tx.wait();
    txHash = receipt?.transactionHash || tx?.hash || '';
  } catch (err) {
    console.warn('Pharmacist shipment status on-chain update failed:', err);
    txHash = '';
  }

  // Optional: log event in blockchaineventlog
  try {
    const eventType = `shipment_status_${status}`;
    // Ensure transaction hash is unique for each event
    await query(
      `INSERT INTO blockchaineventlog (eventname, contractname, entityid, entitytype, transactionhash, timestamp)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (transactionhash) DO NOTHING`,
      [eventType, 'DrugSupplyChain', shipmentId, 'shipment', txHash]
    );
  } catch (logErr) {
    console.warn('Pharmacist shipment status event log failed:', logErr);
  }

  return { success: true };
}
// Edit a batch request and sync changes to chain
export async function updatePharmacistRequest(userId, requestId, updateData) {
  // Ensure the request belongs to the pharmacist
  const pharmacistRes = await query("SELECT * FROM pharmacist WHERE userid = $1", [userId]);
  const pharmacist = pharmacistRes.rows[0];
  if (!pharmacist) return { success: false, message: "Pharmacist not found" };
  // Update batch_request in DB
  const fields = [];
  const values = [requestId, pharmacist.id];
  let idx = 3;
  for (const key in updateData) {
    if (key !== 'quantity_requested') continue;
    fields.push(`quantity_requested = $${idx}`);
    values.push(updateData[key]);
    idx++;
  }
  if (fields.length === 0) return { success: false, message: "No fields to update" };
  const sql = `UPDATE batch_request SET ${fields.join(", ")}, updated_at = NOW() WHERE id = $1 AND pharmacist_id = $2 RETURNING *`;
  const result = await query(sql, values);
  if (result.rowCount === 0) return { success: false, message: "Batch request not found or not owned by pharmacist" };
  const batchRequest = result.rows[0];
  // Sync edit to chain
  let txHash = null;
  try {
    const fsModule = await import('fs');
    const pathModule = await import('path');
    const mapPath = pathModule.resolve(process.cwd(), 'batchrequest_ids.json');
    let mappings = [];
    if (fsModule.existsSync(mapPath)) {
      try {
        const fileContent = fsModule.readFileSync(mapPath, 'utf8');
        mappings = fileContent ? JSON.parse(fileContent) : [];
      } catch (err) {
        console.error('[BatchRequestEdit] Failed to read mapping file:', err);
        mappings = [];
      }
    } else {
      console.error('[BatchRequestEdit] Mapping file does not exist:', mapPath);
    }
    const mapping = mappings.find(m => m.dbBatchRequestId == batchRequest.id);
    if (!mapping || !mapping.requestId) {
      console.error(`[BatchRequestEdit] No valid mapping found for dbBatchRequestId=${batchRequest.id}`);
      return { success: false, message: `No valid blockchain mapping for batch request ID ${batchRequest.id}. Cannot edit on-chain.` };
    }
    // Check if batch request exists on-chain before edit
    const existsOnChain = await batchRequestExistsOnChain(mapping.requestId);
    if (!existsOnChain) {
      console.error(`[BatchRequestEdit] Batch request ${mapping.requestId} does not exist on-chain. Cannot edit.`);
      return { success: false, message: `Batch request ${mapping.requestId} does not exist on-chain. Cannot edit.` };
    }
    try {
      // Fetch pharmacist Ethereum address from users table using logged-in userId
      const pharmacistUserRes = await query("SELECT wallet_address FROM users WHERE id = $1", [userId]);
      const pharmacistAddress = pharmacistUserRes.rows[0]?.wallet_address;
      // Fetch distributor Ethereum address from users table using distributor's userId
      const distributorUserRes = await query(
        "SELECT wallet_address FROM users WHERE id = (SELECT userid FROM distributor WHERE id = $1)",
        [batchRequest.distributor_id]
      );
      const distributorAddress = distributorUserRes.rows[0]?.wallet_address;
      if (!pharmacistAddress || !distributorAddress) {
        console.error(`[BatchRequestEdit] Missing pharmacist or distributor address for batchRequestId=${batchRequest.id}`);
        return { success: false, message: "Missing pharmacist or distributor address" };
      }
      const { getDrugSupplyChainContract } = await import('./blockchainService.js');
      const contract = getDrugSupplyChainContract();
      console.log(`[BatchRequestEdit] Calling contract.editBatchRequest with requestId=${mapping.requestId}, batchId=${batchRequest.batch_id}`);
      // Log all parameters for edit
      console.log('[DEBUG] Batch request edit params:', {
        requestId: mapping.requestId,
        batchId: batchRequest.batch_id,
        pharmacistAddress,
        quantityRequested: batchRequest.quantity_requested,
        drugId: batchRequest.drug_id,
        distributorId: batchRequest.distributor_id,
        status: batchRequest.status
      });
      // Log contract stored values for this requestId
      try {
        const { drugSupplyChainContract } = await import('../config/blockchain.js');
        const req = await drugSupplyChainContract.batchRequests(mapping.requestId);
        console.log('[DEBUG] Contract stored batchRequest:', {
          requestId: req.requestId?.toString(),
          batchId: req.batchId?.toString(),
          pharmacist: req.pharmacist,
          quantityRequested: req.quantityRequested?.toString(),
          drugId: req.drugId?.toString(),
          distributorId: req.distributorId?.toString(),
          status: req.status,
          isDeleted: req.isDeleted
        });
      } catch (err) {
        console.error('[DEBUG] Failed to fetch contract batchRequest for edit:', err);
      }
      const tx = await contract.editBatchRequest(
        mapping.requestId,
        batchRequest.batch_id,
        pharmacistAddress,
        batchRequest.quantity_requested,
        batchRequest.drug_id,
        batchRequest.distributor_id,
        batchRequest.status
      );
      if (tx && tx.hash) {
        txHash = tx.hash;
        console.log(`[BatchRequestEdit] Contract call succeeded for dbBatchRequestId=${batchRequest.id}, txHash=${tx.hash}`);
      } else {
        console.error(`[BatchRequestEdit] No transaction hash returned for dbBatchRequestId=${batchRequest.id}`);
      }
    } catch (contractErr) {
      console.error(`[BatchRequestEdit] Contract call failed for dbBatchRequestId=${batchRequest.id}:`, contractErr);
    }
  } catch (chainErr) {
    console.error('[BatchRequestEdit] Unexpected error:', chainErr);
  }
  return { success: true, updated: true, request: batchRequest, txHash };
}
// Soft delete a batch request by ID
export async function deletePharmacistRequest(userId, requestId) {
  // Ensure the request belongs to the pharmacist
  const pharmacistRes = await query("SELECT * FROM pharmacist WHERE userid = $1", [userId]);
  const pharmacist = pharmacistRes.rows[0];
  if (!pharmacist) return { success: false, message: "Pharmacist not found" };
  // Soft delete: set is_deleted = true
  const result = await query(
    "UPDATE batch_request SET is_deleted = true, archived_at = NOW() WHERE id = $1 AND pharmacist_id = $2 RETURNING *",
    [requestId, pharmacist.id]
  );
  if (result.rowCount === 0) return { success: false, message: "Batch request not found or not owned by pharmacist" };

  // On-chain deletion event
  const batchRequest = result.rows[0];
  let txHash = null;
  if (batchRequest) {
    try {
      // Use contract instance from config/blockchain.js
      const { drugSupplyChainContract } = await import('../config/blockchain.js');
      const contract = drugSupplyChainContract;
      // Find mapping
      const fs = await import('fs');
      const path = await import('path');
      const mapPath = path.resolve(process.cwd(), 'batchrequest_ids.json');
      let mappings = [];
      if (fs.existsSync(mapPath)) {
        try {
          const fileContent = fs.readFileSync(mapPath, 'utf8');
          mappings = fileContent ? JSON.parse(fileContent) : [];
        } catch (err) { mappings = []; }
      }
        const mappingIdx = mappings.findIndex(m => m.dbBatchRequestId == batchRequest.id);
        if (mappingIdx === -1 || !mappings[mappingIdx].requestId) {
          console.error(`[BatchRequestDelete] No valid mapping found for dbBatchRequestId=${batchRequest.id}`);
          return { success: false, message: `No valid blockchain mapping for batch request ID ${batchRequest.id}. Cannot delete on-chain.` };
        }
        const tx = await contract.deleteBatchRequest(mappings[mappingIdx].requestId);
        if (tx && tx.hash) {
          txHash = tx.hash;
          console.log(`[BatchRequestDelete] Contract call succeeded for dbBatchRequestId=${batchRequest.id}, txHash=${tx.hash}`);
        } else {
          console.error(`[BatchRequestDelete] No transaction hash returned for dbBatchRequestId=${batchRequest.id}`);
        }
        // Remove mapping
        mappings.splice(mappingIdx, 1);
        fs.writeFileSync(mapPath, JSON.stringify(mappings, null, 2));
    } catch (chainErr) {
      console.warn('Blockchain batch_request delete failed:', chainErr);
    }
  }
  return { success: true, deleted: true, request: result.rows[0], txHash };
}
// Centralized shipment status update with blockchain logging
export async function updateShipmentStatusWithAudit(shipmentId, pharmacistId, newStatus, extra = {}) {
  // Set session variable for audit triggers
  if (extra && extra.userId) {
    await query(`SET app.current_user_id = '${extra.userId}'`);
  }
  // Update status in DB
  await query(
    `UPDATE shipment SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND pharmacist_id = $3`,
    [newStatus, shipmentId, pharmacistId]
  );

  // Blockchain event logging for shipment status change
  try {
    const { logAuditOnChain } = await import("../services/blockchainService.js");
    const auditResult = await logAuditOnChain({
      description: `Shipment status changed to '${newStatus}' for shipmentId=${shipmentId}, pharmacistId=${pharmacistId}`,
      entityType: "shipment",
      entityId: shipmentId
    });
    // Save blockchain event to blockchaineventlog
    const eventType = `shipment_status_${newStatus}`;
    const txHash = auditResult?.transactionHash || auditResult?.txHash || null;
    await query(
      `INSERT INTO blockchaineventlog (eventtype, entitytype, entityid, transactionhash, timestamp, extradata) VALUES ($1, $2, $3, $4, NOW(), $5)`,
      [eventType, "shipment", shipmentId, txHash, JSON.stringify(extra)]
    );
  } catch (chainErr) {
    console.warn("Blockchain shipment status event failed:", chainErr);
  }
}
// Centralized batch_request status update with blockchain logging
export async function updateBatchRequestStatus(batchRequestId, newStatus, extra = {}) {
  // Update status in DB
  await query("UPDATE batch_request SET status = $1, updated_at = NOW() WHERE id = $2", [newStatus, batchRequestId]);
  // On-chain edit logging
  try {
    // Use contract instance from config/blockchain.js
    const { drugSupplyChainContract } = await import('../config/blockchain.js');
    const supplyChain = drugSupplyChainContract;
    // Find mapping
    const fs = await import('fs');
    const path = await import('path');
    const mapPath = path.resolve(process.cwd(), 'batchrequest_shipment_drugbatch_ids.js');
    let mappings = [];
    if (fs.existsSync(mapPath)) {
      try {
        const fileContent = fs.readFileSync(mapPath, 'utf8');
        mappings = fileContent ? JSON.parse(fileContent) : [];
      } catch (err) { mappings = []; }
    }
    const mapping = mappings.find(m => m.dbBatchRequestId == batchRequestId);
    if (mapping) {
      // Fetch batch_request row for edit
      const batchReqRes = await query('SELECT * FROM batch_request WHERE id = $1', [batchRequestId]);
      const batchReq = batchReqRes.rows[0];
      await supplyChain.editBatchRequest(
        mapping.requestId,
        batchReq.batch_id,
        batchReq.pharmacist_id,
        batchReq.quantity_requested,
        batchReq.drug_id,
        batchReq.distributor_id,
        newStatus
      );
    }
  } catch (chainErr) {
    console.warn('Blockchain batch_request edit failed:', chainErr);
  }
}
// Expire a prescription by ID
export async function expirePharmacistPrescription(prescriptionId) {
  // Update prescription status to 'expired'
  const sql = `UPDATE prescription SET status = 'expired', updated_at = NOW() WHERE id = $1 RETURNING *`;
  const { rows } = await query(sql, [prescriptionId]);
  if (rows.length === 0) throw new Error('Prescription not found');
  return rows[0];
}

export async function getPharmacistPrescriptions() {
  // Join prescription, patient, doctor, drug tables for full details
  const sql = `
    SELECT p.id, p.prescription_code, p.status, p.issue_date, p.valid_until, p.dosage_amount, p.dosage_unit, p.frequency, p.duration, p.instructions,
      pa.id as patient_id, u.full_name as patient_name,
      d.id as doctor_id, du.full_name as doctor_name,
      dr.id as drug_id, dr.name as drug_name,
      p.quantity
    FROM prescription p
    LEFT JOIN patient pa ON p.patient_id = pa.id
    LEFT JOIN users u ON pa.userid = u.id
    LEFT JOIN doctor d ON p.doctor_id = d.id
    LEFT JOIN users du ON d.userid = du.id
    LEFT JOIN drug dr ON p.drug_id = dr.id
    WHERE p.is_deleted = false
    ORDER BY p.issue_date DESC
  `;
  const { rows } = await query(sql);
  // Load blockchain mappings using ES module imports
  const fs = await import('fs');
  const path = await import('path');
  const mapPath = path.resolve(process.cwd(), 'prescription_id_map.json');
  let mappings = [];
  if (fs.existsSync(mapPath)) {
    try {
      const fileContent = fs.readFileSync(mapPath, 'utf8');
      mappings = JSON.parse(fileContent);
    } catch (err) {
      mappings = [];
    }
  }
  
    return rows.map(p => {
      const mapping = mappings.find(m => m.databaseId == p.id);
      return {
        id: p.id,
        prescriptionCode: p.prescription_code,
        status: p.status,
        issueDate: p.issue_date,
        validUntil: p.valid_until,
        dosageAmount: p.dosage_amount,
        dosageUnit: p.dosage_unit,
        frequency: p.frequency,
        duration: p.duration,
        instructions: p.instructions,
        patientId: p.patient_id,
        patientName: p.patient_name,
        doctorId: p.doctor_id,
        doctorName: p.doctor_name,
        drugId: p.drug_id,
        drug: p.drug_name,
        quantity: p.quantity,
        contractPrescriptionId: mapping ? mapping.contractPrescriptionId : null,
        blockchainMapped: !!mapping
      };
    });
  }

import { query } from "../config/database.js";
import { updateShipmentStatusOnChain } from "./blockchainService.js";
import { getContractBatchId } from "../utils/blockchainMappings.js";

export async function confirmPharmacistDelivery(userId, shipmentId, status) {
  const pharmacistRes = await query("SELECT * FROM pharmacist WHERE userid = $1", [userId]);
  const pharmacist = pharmacistRes.rows[0];
  if (!pharmacist) throw new Error('Pharmacist not found');

  const shipRes = await query("SELECT * FROM shipment WHERE id = $1", [shipmentId]);
  const shipment = shipRes.rows[0];
  if (!shipment) throw new Error('Shipment not found');

  if (shipment.status !== 'delivered') throw new Error('Shipment must be delivered by distributor first');
  if (status !== 'completed' && status !== 'flagged') throw new Error('Invalid pharmacist status');

  await updateShipmentStatusWithAudit(shipmentId, pharmacist.id, status, { pharmacistId: pharmacist.id, shipmentId, status });
  // Find batch_request id
  const batchReqRes = await query("SELECT id FROM batch_request WHERE batch_id = $1 AND pharmacist_id = $2", [shipment.batch_id, pharmacist.id]);
  const batchRequestId = batchReqRes.rows[0]?.id;
  if (batchRequestId) {
    await updateBatchRequestStatus(batchRequestId, status, { pharmacistId: pharmacist.id, batchId: shipment.batch_id, status });
    // Also update delivered_date if status is completed/flagged
    if (status === 'completed' || status === 'flagged') {
      await query("UPDATE batch_request SET delivered_date = NOW() WHERE id = $1", [batchRequestId]);
    }
  }

  // Inventory update is now handled by database trigger trg_increase_inventory_after_shipment

  // Blockchain tracking for shipment completion/flagging
  try {
    const { updateShipmentStatusOnChain } = await import('./blockchainService.js');
    const receipt = await updateShipmentStatusOnChain(shipmentId, status);
    const eventSql = `
      INSERT INTO blockchaineventlog
        (eventname, contractname, entityid, entitytype, transactionhash, blocknumber, timestamp, processed)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
    `;
    await query(eventSql, [
      status === 'completed' ? 'ShipmentCompleted' : 'ShipmentFlagged',
      'DrugSupplyChain',
      shipmentId,
      'shipment',
      receipt.transactionHash,
      receipt.blockNumber,
      new Date().toISOString(),
      false
    ]);
  } catch (chainErr) {
    console.error('❌ Failed to update shipment status on-chain:', chainErr);
  }

  return { success: true };
}

export async function getPharmacistDrugBatchesByDrugId(drugId) {
  const sql = `
    SELECT db.*, dr.name as drug_name
    FROM drugbatch db
    LEFT JOIN drug dr ON db.drugid = dr.id
    WHERE db.drugid = $1 AND db.is_deleted = false
    ORDER BY db.expirydate ASC
  `;
  const { rows } = await query(sql, [drugId]);
  return rows;
}
export async function getPharmacistAnalytics(userId) {
  const pharmacistRes = await query("SELECT * FROM pharmacist WHERE userid = $1", [userId]);
  const pharmacist = pharmacistRes.rows[0];
  if (!pharmacist) {
    return { error: "Pharmacist not found" };
  }

  // Prescriptions: issued, expired, dispensed
  const prescriptionsRes = await query(`
    SELECT p.*, pa.id as patient_id, u.full_name as patient_name, d.id as doctor_id, du.full_name as doctor_name, dr.id as drug_id, dr.name as drug_name
    FROM prescription p
    LEFT JOIN patient pa ON p.patient_id = pa.id
    LEFT JOIN users u ON pa.userid = u.id
    LEFT JOIN doctor d ON p.doctor_id = d.id
    LEFT JOIN users du ON d.userid = du.id
    LEFT JOIN drug dr ON p.drug_id = dr.id
    WHERE p.is_deleted = false AND (p.status = 'issued' OR p.status = 'expired' OR p.status = 'dispensed')
    ORDER BY p.issue_date DESC
  `);

  // Shipments: delivered, completed
  const shipmentsRes = await query(`
    SELECT s.*, db.batchnumber, dr.name as drug_name
    FROM shipment s
    LEFT JOIN drugbatch db ON s.batch_id = db.id
    LEFT JOIN drug dr ON db.drugid = dr.id
    WHERE s.pharmacist_id = $1 AND (s.status = 'delivered' OR s.status = 'completed') AND (s.is_deleted IS NULL OR s.is_deleted = false)
    ORDER BY s.created_at DESC
  `, [pharmacist.id]);

  // Batch requests: pending, flagged, completed
  const batchRequestsRes = await query(`
    SELECT br.*, db.batchnumber, dr.name as drug_name
    FROM batch_request br
    LEFT JOIN drugbatch db ON br.batch_id = db.id
    LEFT JOIN drug dr ON br.drug_id = dr.id
    WHERE br.pharmacist_id = $1 AND (br.status = 'pending' OR br.status = 'flagged' OR br.status = 'completed') AND (br.is_deleted IS NULL OR br.is_deleted = false)
    ORDER BY br.request_date DESC
  `, [pharmacist.id]);

  // Inventory: all drugs in pharmacy
  const inventoryRes = await query(`
    SELECT inv.id as inventory_id, inv.batch_id, inv.drug_id, inv.distributor_id, inv.pharmacist_id,
      inv.total_batch_quantity, inv.available_quantity, inv.minimum_stock_level, inv.expiry_date, inv.last_updated,
      db.batchnumber, db.expirydate as batch_expiry, db.distributorcompanyid, db.total_batch_quantity as batch_quantity,
      CASE WHEN inv.drug_id IS NOT NULL THEN inv.drug_id ELSE db.drugid END as drug_id,
      dr.name as drug_name, dr.code as drug_code, dr.formulation, dr.dosageunit
    FROM inventory inv
    LEFT JOIN drugbatch db ON inv.batch_id = db.id
    LEFT JOIN drug dr ON (dr.id = inv.drug_id OR dr.id = db.drugid)
    WHERE inv.pharmacist_id = $1
    ORDER BY inv.last_updated DESC
  `, [pharmacist.id]);

  // Build analytics arrays for tabs
  const dispensed = prescriptionsRes.rows.filter(p => p.status === 'dispensed');
  const issued = prescriptionsRes.rows.filter(p => p.status === 'issued');
  const expired = prescriptionsRes.rows.filter(p => p.status === 'expired');
  const deliveredShipments = shipmentsRes.rows.filter(s => s.status === 'delivered' || s.status === 'completed');
  const pending = batchRequestsRes.rows.filter(br => br.status === 'pending');
  const completedBatchRequests = batchRequestsRes.rows.filter(br => br.status === 'completed');
  const inventory = inventoryRes.rows.map(row => ({
    inventory_id: row.inventory_id,
    batch_id: row.batch_id,
    drug_id: row.drug_id,
    distributor_id: row.distributor_id,
    pharmacist_id: row.pharmacist_id,
    total_batch_quantity: row.total_batch_quantity,
    available_quantity: row.available_quantity,
    minimum_stock_level: row.minimum_stock_level,
    expiry_date: row.expiry_date,
    last_updated: row.last_updated,
    batch_number: row.batchnumber,
    batch_expiry: row.batch_expiry,
    distributorcompanyid: row.distributorcompanyid,
    batch_quantity: row.batch_quantity,
    drug_name: row.drug_name,
    drug_code: row.drug_code,
    formulation: row.formulation,
    dosageunit: row.dosageunit
  }));

  // All logs: combine all relevant records
  const allLogs = [
    ...issued.map(p => ({ type: 'prescription_issued', ...p })),
    ...expired.map(p => ({ type: 'prescription_expired', ...p })),
    ...dispensed.map(p => ({ type: 'prescription_dispensed', ...p })),
    ...deliveredShipments.map(s => ({ type: 'shipment_delivered', ...s })),
    ...pending.map(br => ({ type: 'batch_request_pending', ...br })),
    ...completedBatchRequests.map(br => ({ type: 'batch_request_completed', ...br })),
    ...inventory.map(inv => ({ type: 'inventory_drug', ...inv }))
  ];

  // Stats
  const totalDispensed = dispensed.length;
  const totalIssued = issued.length;
  const totalExpired = expired.length;
  const totalDeliveredShipments = deliveredShipments.length;
  const totalPendingBatchRequests = pending.length;
  const totalCompletedBatchRequests = completedBatchRequests.length;
  const inventoryUpdates = inventory.length;
  const failedDispenses = 0;

  return {
    dispensed,
    issued,
    expired,
    deliveredShipments,
    pending,
    completedBatchRequests,
    inventory,
    all: allLogs.sort((a, b) => {
      // Sort by created_at, request_date, or last_updated
      const aTime = a.created_at || a.request_date || a.last_updated || 0;
      const bTime = b.created_at || b.request_date || b.last_updated || 0;
      return new Date(bTime) - new Date(aTime);
    }),
    stats: {
      totalDispensed,
      totalIssued,
      totalExpired,
      totalDeliveredShipments,
      totalPendingBatchRequests,
      totalCompletedBatchRequests,
      inventoryUpdates,
      failedDispenses
    }
  };
}

export async function getPharmacistByUserId(userId) {
  const { rows } = await query("SELECT * FROM pharmacist WHERE userid = $1", [userId]);
  return rows[0] || null;
}

export async function updatePharmacistByUserId(userId, updateData) {
  const keys = Object.keys(updateData);
  if (keys.length === 0) return null;
  const setClause = keys.map((k, i) => `${k} = $${i + 2}`).join(", ");
  const values = [userId, ...keys.map(k => updateData[k])];
  await query(`UPDATE pharmacist SET ${setClause} WHERE userid = $1`, values);
  const { rows } = await query("SELECT * FROM pharmacist WHERE userid = $1", [userId]);
  return rows[0] || null;
}

export async function getPharmacistDashboard(userId) {
  // Get pharmacist id
  const pharmacistRes = await query("SELECT * FROM pharmacist WHERE userid = $1", [userId]);
  const pharmacist = pharmacistRes.rows[0];
  if (!pharmacist) return {};

  // Prescriptions count
  const presRes = await query("SELECT COUNT(*) FROM prescription WHERE is_deleted = false AND dispensed_by = $1", [pharmacist.id]);
  // Inventory count
  const invRes = await query("SELECT COUNT(*) FROM inventory WHERE pharmacist_id = $1", [pharmacist.id]);
  // Requests count
  const reqRes = await query("SELECT COUNT(*) FROM batch_request WHERE pharmacist_id = $1 AND (is_deleted IS NULL OR is_deleted = false)", [pharmacist.id]);
  // Shipments count
  const shipRes = await query("SELECT COUNT(*) FROM shipment WHERE pharmacist_id = $1 AND (is_deleted IS NULL OR is_deleted = false)", [pharmacist.id]);

  return {
    prescriptions: presRes.rows[0].count,
    inventory: invRes.rows[0].count,
    requests: reqRes.rows[0].count,
    shipments: shipRes.rows[0].count
  };
}

export async function verifyPrescription(qrCode) {
  // Query prescription by QR code
  const sql = `
    SELECT p.*, dr.name as drug_name, pa.id as patient_id, u.full_name as patient_name
    FROM prescription p
    LEFT JOIN drug dr ON p.drug_id = dr.id
    LEFT JOIN patient pa ON p.patient_id = pa.id
    LEFT JOIN users u ON pa.userid = u.id
    WHERE p.prescription_code = $1 AND p.is_deleted = false
  `;
  const { rows } = await query(sql, [qrCode]);
  if (rows.length === 0) return { valid: false, message: "Prescription not found" };
  const p = rows[0];
  return {
    valid: true,
    prescription: {
      id: p.id,
      prescriptionCode: p.prescription_code,
      status: p.status,
      drug: p.drug_name,
      patient: p.patient_name,
      issueDate: p.issue_date,
      validUntil: p.valid_until
  }
};
}

// Only export the correct dispenseDrug function
// Update prescription status in DB to match contract
export async function updatePrescriptionStatus(prescriptionId, status) {
  const sql = `UPDATE prescription SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`;
  const { rows } = await query(sql, [status, prescriptionId]);
  if (rows.length === 0) throw new Error("Prescription not found");
  return rows[0];
}

// Get contractPrescriptionId from mapping
export async function getContractPrescriptionId(databaseId) {
  const fs = await import('fs');
  const path = await import('path');
  const mapPath = path.resolve(process.cwd(), 'prescription_id_map.json');
  if (!fs.existsSync(mapPath)) throw new Error("Mapping file not found");
  const mappings = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
  const mapping = mappings.find(obj => String(obj.databaseId) === String(databaseId));
  if (!mapping) throw new Error("Mapping not found");
  return mapping.contractPrescriptionId;
}
export async function dispenseDrug(prescriptionId, pharmacistUserId, drugId, quantity) {
  console.log('[DEBUG] dispenseDrug ENTRY:', { prescriptionId, pharmacistUserId, drugId, quantity });
  // Get prescription details
  const presRes = await query("SELECT * FROM prescription WHERE id = $1", [prescriptionId]);
  const prescription = presRes.rows[0];
  if (!prescription) throw new Error('Prescription not found');
  // Debug: log prescription details after initialization
  console.log('[DEBUG] Prescription details:', prescription);

  // Get pharmacist by userId
  const pharmacistRes = await query("SELECT * FROM pharmacist WHERE userid = $1", [pharmacistUserId]);
  const pharmacist = pharmacistRes.rows[0];
  if (!pharmacist) throw new Error('Pharmacist not found');
  // Debug: log pharmacist details after initialization
  console.log('[DEBUG] Pharmacist details:', pharmacist);
  // Debug: log pharmacist details after initialization
  console.log('[DEBUG] Pharmacist details:', pharmacist);
  // Check prescription status before calling contract
  if (prescription.status !== 'issued') {
    console.error(`[DISPENSE] DB status is not 'issued' for prescriptionId ${prescriptionId}, actual: ${prescription.status}`);
    throw new Error(`Prescription cannot be dispensed. Current status: '${prescription.status}'. Only 'issued' prescriptions can be dispensed.`);
  }
  // Check if prescription is expired
  const nowDate = new Date();
  if (prescription.valid_until && new Date(prescription.valid_until) < nowDate) {
    console.error(`[DISPENSE] Prescription ${prescriptionId} is expired. valid_until: ${prescription.valid_until}`);
    throw new Error('Prescription is expired');
  }
  // Find inventory for this drug by pharmacist_id
  const invRes = await query(
    `SELECT * FROM inventory WHERE drug_id = $1 AND pharmacist_id = $2 AND available_quantity > 0 ORDER BY available_quantity DESC`,
    [drugId, pharmacist.id]
  );
  let totalAvailable = 0;
  for (const inv of invRes.rows) {
    totalAvailable += inv.available_quantity;
  }
  if (totalAvailable < quantity) throw new Error('Insufficient inventory for this drug');


  // --- Blockchain event logging ---
  // Load contractPrescriptionId from prescription_id_map.json
  const fs = await import('fs');
  const path = await import('path');
  const { fileURLToPath } = await import('url');
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const mapPath = path.resolve(__dirname, '../../prescription_id_map.json');
  let contractPrescriptionId = null;
  if (fs.existsSync(mapPath)) {
    try {
      const mappings = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
      for (const obj of mappings) {
        if (obj.databaseId == prescriptionId) {
          contractPrescriptionId = obj.contractPrescriptionId;
          break;
        }
      }
    } catch (err) {
      console.warn(`[MAPPING WARNING] Failed to parse mapping file: ${err}`);
    }
  }
  console.log('[DEBUG] contractPrescriptionId resolved:', contractPrescriptionId);
  if (!contractPrescriptionId) throw new Error('No contractPrescriptionId mapping found for this prescription');

  // Check on-chain existence and status before dispensing
  const { getPrescriptionOnChain, dispensePrescriptionOnChain } = await import('./blockchainService.js');
  let onChainPrescription;
  let onChainStatus;
  try {
    onChainPrescription = await getPrescriptionOnChain(contractPrescriptionId);
    console.log('[DEBUG] Full onChainPrescription object:', onChainPrescription);
    if (!onChainPrescription || !onChainPrescription.exists) {
      console.error(`[DISPENSE] On-chain prescription not found for contractPrescriptionId ${contractPrescriptionId}`);
      throw new Error('Prescription not found on-chain');
    }
    // Status: 0 = issued, 1 = dispensed, 2 = expired, 3 = invalid
    let onChainStatus = onChainPrescription.status;
    let statusNum = onChainStatus;
    if (typeof onChainStatus === 'object' && onChainStatus.type === 'BigNumber' && onChainStatus.hex) {
      statusNum = parseInt(onChainStatus.hex, 16);
    }
    if (statusNum !== 0) {
      console.error(`[DISPENSE] On-chain status is not 'issued' (0) for contractPrescriptionId ${contractPrescriptionId}, actual: ${statusNum}`);
      throw new Error('Prescription is not in issued status and cannot be dispensed');
    }
  } catch (err) {
    console.error(`[DISPENSE] Error checking on-chain status for contractPrescriptionId ${contractPrescriptionId}:`, err);
    throw new Error('Prescription not found or not valid for dispensing on-chain: ' + err.message);
  }

  // Load pharmacist wallet address
  const usersRes = await query('SELECT wallet_address FROM users WHERE id = $1', [pharmacist.userid]);
  const pharmacistWallet = usersRes.rows[0]?.wallet_address;
  if (!pharmacistWallet || !pharmacistWallet.startsWith('0x')) throw new Error('Pharmacist wallet address missing or invalid');

  // Dispense on-chain
  let txReceipt;
  console.log('[DEBUG] pharmacistWallet:', pharmacistWallet);
  console.log('[DEBUG] Calling dispensePrescriptionOnChain with:', { contractPrescriptionId, pharmacistWallet });
  let now;
  try {
    // Always pass contractPrescriptionId, not databaseId
    txReceipt = await dispensePrescriptionOnChain(contractPrescriptionId);
    console.log('[DEBUG] dispensePrescriptionOnChain returned txReceipt:', txReceipt);
    // Confirm on-chain status is 'dispensed' (1)
    const prescOnChain = await getPrescriptionOnChain(contractPrescriptionId);
    let statusNum = prescOnChain.status;
    if (typeof statusNum === 'object' && statusNum.type === 'BigNumber' && statusNum.hex) {
      statusNum = parseInt(statusNum.hex, 16);
    }
    if (statusNum === 1) {
      now = new Date();
      await query(
        `UPDATE prescription SET status = 'dispensed', dispensed_by = $1, dispensed_date = $2 WHERE id = $3 RETURNING *`,
        [pharmacist.id, now, prescriptionId]
      );
      console.log(`[DISPENSE] DB status updated to 'dispensed' for prescriptionId ${prescriptionId} after confirming on-chain status.`);
    } else {
      console.error(`[DISPENSE] On-chain status is not 'dispensed' (1) after contract call for contractPrescriptionId ${contractPrescriptionId}, actual: ${statusNum}`);
      throw new Error("On-chain status is not 'dispensed' after dispensing");
    }
  } catch (err) {
    console.error('[DISPENSE] Blockchain dispense error:', err);
    // Do NOT update DB status if contract call fails or status is not dispensed
    throw new Error('Blockchain dispense failed: ' + err.message);
  }
  // Deduct quantity from inventory
  let qtyToDeduct = quantity;
  for (const inv of invRes.rows) {
    const deduct = Math.min(inv.available_quantity, qtyToDeduct);
    console.log('[DEBUG] Deducting inventory:', { invId: inv.id, deduct });
    await query(
      `UPDATE inventory SET available_quantity = available_quantity - $1, total_batch_quantity = total_batch_quantity - $1 WHERE id = $2`,
      [deduct, inv.id]
    );
    qtyToDeduct -= deduct;
    // Optionally, fetch updated quantity if needed for debug
    // const updatedInv = await query(`SELECT available_quantity FROM inventory WHERE id = $1`, [inv.id]);
    // console.log('[DEBUG] Inventory updated:', { invId: inv.id, newQty: updatedInv.rows[0]?.available_quantity });
  }

  // Debug: log the full transaction receipt object
  console.log('[DEBUG] Full txReceipt object:', txReceipt);
  // Do not log PrescriptionDispensed event here; event listener will handle blockchain event logging and deduplication.

  // Return updated prescription
  const { rows } = await query(`SELECT * FROM prescription WHERE id = $1`, [prescriptionId]);
  return rows[0] || {};
}

export async function getPharmacistInventory(userId) {
  // Get pharmacist's facility_id
  const pharmacistRes = await query("SELECT * FROM pharmacist WHERE userid = $1", [userId]);
  const pharmacist = pharmacistRes.rows[0];
  if (!pharmacist) {
      console.log('[DEBUG] No pharmacist found for userId:', userId);
      return [];
  }

  // Use pharmacist.companyid directly as facility_id for inventory query
  const facilityId = pharmacist.companyid;
  const pharmacistId = pharmacist.id;
  if (!facilityId) {
    console.log('[DEBUG] No facilityId resolved for pharmacist:', pharmacist);
    return [];
  }

  const sql = `
    SELECT inv.id as inventory_id, inv.batch_id, inv.drug_id, inv.distributor_id, inv.pharmacist_id,
      inv.total_batch_quantity, inv.available_quantity, inv.minimum_stock_level, inv.expiry_date, inv.last_updated,
      db.batchnumber, db.expirydate as batch_expiry, db.distributorcompanyid, db.total_batch_quantity as batch_quantity,
      CASE WHEN inv.drug_id IS NOT NULL THEN inv.drug_id ELSE db.drugid END as drug_id,
      dr.name as drug_name, dr.code as drug_code, dr.formulation, dr.dosageunit
    FROM inventory inv
    LEFT JOIN drugbatch db ON inv.batch_id = db.id
    LEFT JOIN drug dr ON (dr.id = inv.drug_id OR dr.id = db.drugid)
    WHERE inv.pharmacist_id = $1
    ORDER BY dr.name ASC, db.expirydate ASC
  `;
  const { rows } = await query(sql, [pharmacistId]);
  console.log('[DEBUG] Raw inventory SQL result:', rows);
  // Group by drug, collect batches per drug
  const drugMap = new Map();
  for (const row of rows) {
    if (!row.drug_id) continue;
    if (!drugMap.has(row.drug_id)) {
      drugMap.set(row.drug_id, {
        drug_id: row.drug_id,
        drug_name: row.drug_name,
        drug_code: row.drug_code,
        formulation: row.formulation,
        dosageunit: row.dosageunit,
        batches: [],
        quantity: 0,
        minimum_stock_level: row.minimum_stock_level || 20,
        availableDrugBatches: []
      });
    }
    // Add batch from inventory
    drugMap.get(row.drug_id).batches.push({
      batch_id: row.batch_id,
      drug_id: row.drug_id,
      distributor_id: row.distributor_id,
      pharmacist_id: row.pharmacist_id,
      facility_id: row.facility_id,
      // facility_type removed, not present in table
      batch_number: row.batchnumber,
      expiry_date: row.expiry_date || row.batch_expiry,
      distributorcompanyid: row.distributorcompanyid,
      batch_quantity: row.batch_quantity !== undefined && row.batch_quantity !== null ? Number(row.batch_quantity) : 0,
      total_batch_quantity: row.total_batch_quantity !== undefined && row.total_batch_quantity !== null ? Number(row.total_batch_quantity) : 0,
      available_quantity: row.available_quantity !== undefined && row.available_quantity !== null ? Number(row.available_quantity) : 0,
      minimum_stock_level: row.minimum_stock_level,
      inventory_id: row.inventory_id,
      last_updated: row.last_updated
    });
    // Sum up total available quantity for this drug
    drugMap.get(row.drug_id).quantity += row.available_quantity !== undefined && row.available_quantity !== null ? Number(row.available_quantity) : 0;
  }
  // Fetch all drugs to ensure every drug is listed
  const allDrugsRes = await query('SELECT id, name, code, formulation, dosageunit FROM drug WHERE is_deleted = false');
  for (const drugRow of allDrugsRes.rows) {
    // Fetch all batches from drugbatch for this drug
    const batchRes = await query('SELECT * FROM drugbatch WHERE drugid = $1 AND is_deleted = false ORDER BY expirydate ASC', [drugRow.id]);
    const availableDrugBatches = batchRes.rows.map(batch => ({
      batch_id: batch.id,
      batch_number: batch.batchnumber,
      expiry_date: batch.expirydate,
      distributorcompanyid: batch.distributorcompanyid,
      batch_quantity: batch.total_batch_quantity !== undefined && batch.total_batch_quantity !== null ? Number(batch.total_batch_quantity) : 0,
      manufacturerid: batch.manufacturerid,
      manufacturedate: batch.manufacturedate,
      qrcode_path: batch.qrcode_path
    }));
    if (!drugMap.has(drugRow.id)) {
      // Drug has no inventory batches, add placeholder
      drugMap.set(drugRow.id, {
        drug_id: drugRow.id,
        drug_name: drugRow.name,
        drug_code: drugRow.code,
        formulation: drugRow.formulation,
        dosageunit: drugRow.dosageunit,
        batches: [
          {
            batch_id: null,
            batch_number: '-',
            expiry_date: '-',
            distributorcompanyid: '-',
            batch_quantity: 0,
            available_quantity: 0,
            inventory_id: null,
            last_updated: null
          }
        ],
        quantity: 0,
        minimum_stock_level: 20,
        availableDrugBatches
      });
    } else {
      // Drug has real batches, do NOT add placeholder
      drugMap.get(drugRow.id).availableDrugBatches = availableDrugBatches;
    }
  }
  return Array.from(drugMap.values());
}


export async function addPharmacistInventory(userId, data) {
  // Get pharmacist
  const pharmacistRes = await query("SELECT p.*, pc.facility_id FROM pharmacist p LEFT JOIN pharmacy_company pc ON p.companyid = pc.id WHERE p.userid = $1", [userId]);
  const pharmacist = pharmacistRes.rows[0];
  if (!pharmacist) return [];
  // Inventory: all drugs in pharmacy
  const inventoryRes = await query(`
    SELECT inv.id as inventory_id, inv.batch_id, inv.drug_id, inv.distributor_id, inv.pharmacist_id, inv.facility_id,
      inv.total_batch_quantity, inv.available_quantity, inv.minimum_stock_level, inv.expiry_date, inv.last_updated,
      db.batchnumber, db.expirydate as batch_expiry, db.distributorcompanyid, db.total_batch_quantity as batch_quantity,
      CASE WHEN inv.drug_id IS NOT NULL THEN inv.drug_id ELSE db.drugid END as drug_id,
      dr.name as drug_name, dr.code as drug_code, dr.formulation, dr.dosageunit
    FROM inventory inv
    LEFT JOIN drugbatch db ON inv.batch_id = db.id
    LEFT JOIN drug dr ON (dr.id = inv.drug_id OR dr.id = db.drugid)
    WHERE inv.pharmacist_id = $1
    ORDER BY inv.last_updated DESC
  `, [pharmacist.id]);
    return inventoryRes.rows[0] || {};
}


export async function updatePharmacistInventory(userId, inventoryId, data) {
  // Get pharmacist
  const pharmacistRes = await query("SELECT * FROM pharmacist WHERE userid = $1", [userId]);
  const pharmacist = pharmacistRes.rows[0];
  if (!pharmacist) return {};
  // Update inventory
  const allowedFields = [
    "batch_id", "drug_id", "distributor_id", "pharmacist_id", "facility_id",
    "total_batch_quantity", "available_quantity", "minimum_stock_level", "expiry_date"
  ];
  const fields = [];
  const values = [inventoryId];
  let idx = 2;
  for (const key in data) {
    if (allowedFields.includes(key)) {
      fields.push(`${key} = $${idx}`);
      values.push(data[key]);
      idx++;
    }
  }
  if (fields.length === 0) return {};
  const sql = `UPDATE inventory SET ${fields.join(", ")}, last_updated = NOW() WHERE id = $1 RETURNING *`;
  const { rows } = await query(sql, values);
  return rows[0] || {};
}


export async function deletePharmacistInventory(userId, inventoryId) {
  // Soft delete inventory: zero out quantities, nullify expiry, pharmacist_id, distributor_id
  const sql = `UPDATE inventory SET available_quantity = 0, total_batch_quantity = 0, expiry_date = NULL, pharmacist_id = NULL, distributor_id = NULL, last_updated = NOW() WHERE id = $1 RETURNING *`;
  const { rows } = await query(sql, [inventoryId]);
  return rows[0] || {};
}


export async function getPharmacistRequests(userId) {
  // Get pharmacist id
  const pharmacistRes = await query("SELECT * FROM pharmacist WHERE userid = $1", [userId]);
  const pharmacist = pharmacistRes.rows[0];
  if (!pharmacist) return [];

  // Query batch_request for this pharmacist
  const sql = `
    SELECT br.id, br.drug_id, dr.name as drug_name, br.batch_id, br.quantity_requested, br.status, br.request_date
    FROM batch_request br
    LEFT JOIN drug dr ON br.drug_id = dr.id
    WHERE br.pharmacist_id = $1 AND (br.is_deleted IS NULL OR br.is_deleted = false)
    ORDER BY br.request_date DESC
  `;
  const { rows } = await query(sql, [pharmacist.id]);
  return rows.map(row => ({
    id: row.id,
    drugId: row.drug_id,
    drugName: row.drug_name,
    batchId: row.batch_id,
    quantity: row.quantity_requested,
    status: row.status,
    requestDate: row.request_date
  }));
}


export async function createPharmacistRequest(userId, data) {
  // Get pharmacist and wallet address from users table
  const pharmacistRes = await query(
    `SELECT p.*, u.wallet_address FROM pharmacist p JOIN users u ON p.userid = u.id WHERE p.userid = $1`,
    [userId]
  );
  const pharmacist = pharmacistRes.rows[0];
  if (!pharmacist) return {};
  console.log(`[DEBUG] createPharmacistRequest: userId=${userId}, walletAddress='${pharmacist.wallet_address}'`);
  // Validate drugId, quantity, batchId, distributorId
  const { drugId, quantity, batchId, distributorId } = data;
  if (!drugId || isNaN(Number(drugId))) {
    throw new Error('Invalid drugId. Must be a valid integer.');
  }
  if (!quantity || isNaN(Number(quantity))) {
    throw new Error('Invalid quantity. Must be a valid integer.');
  }
  let batch_id = batchId;
  let distributor_id = distributorId;
  if (!batch_id || isNaN(Number(batch_id))) {
    throw new Error('Invalid batchId. Must be a valid integer.');
  }
  if (!distributor_id || isNaN(Number(distributor_id))) {
    throw new Error('Invalid distributorId. Must be a valid integer.');
  }
  // --- ATOMIC ON-CHAIN CREATION ---
  let chainRequestId = null;
  const insertResult = await query(`
    INSERT INTO batch_request (
      pharmacist_id, drug_id, batch_id, quantity_requested, distributor_id
    ) VALUES ($1, $2, $3, $4, $5) RETURNING *
  `, [
    pharmacist.id,
    Number(drugId),
    Number(batch_id),
    Number(quantity),
    Number(distributor_id)
  ]);
  const batchRequest = insertResult.rows[0];
  if (!batchRequest || !batchRequest.id) throw new Error('Failed to insert batch request into DB');
  // Log after batchRequest is initialized
  console.log('[DEBUG] Batch request creation params:', {
    dbBatchRequestId: batchRequest.id,
    batchId,
    walletAddress: pharmacist.wallet_address,
    quantity,
    drugId,
    distributorId
  });
  const walletAddress = pharmacist.wallet_address;
  const isValidEthAddress = walletAddress && /^0x[a-fA-F0-9]{40}$/.test(walletAddress);
  if (!isValidEthAddress) {
    throw new Error('Pharmacist wallet address is missing or invalid. Please update your profile with a valid Ethereum address.');
  }
  // ...existing code for contract call and mapping...

      // 2. Call contract with DB requestId
      let contractSucceeded = false;
      try {
        // Use contract instance from config/blockchain.js
        const { drugSupplyChainContract } = await import('../config/blockchain.js');
        const tx = await drugSupplyChainContract.requestBatch(
          Number(batchRequest.id),
          Number(batch_id),
          walletAddress,
          Number(quantity),
          Number(drugId),
          Number(distributor_id)
        );
        const receipt = await tx.wait();
        // Extract contract requestId from event
        const batchRequestedEvent = receipt.events?.find(ev => ev.event === 'BatchRequested');
        chainRequestId = batchRequestedEvent?.args?.requestId?.toString();
        if (!chainRequestId) throw new Error('No requestId returned from contract');
        contractSucceeded = true;
      } catch (chainErr) {
        // If contract call fails, delete the DB row to avoid duplicate key errors
        console.error('❌ Failed to log batch request on-chain:', chainErr);
        try {
          await query('DELETE FROM batch_request WHERE id = $1', [batchRequest.id]);
          console.log(`[DEBUG] Rolled back batch_request DB row for id=${batchRequest.id}`);
        } catch (dbErr) {
          console.error(`[ERROR] Failed to rollback batch_request DB row for id=${batchRequest.id}:`, dbErr);
        }
        throw new Error('Failed to log batch request on-chain: ' + chainErr.message);
      }

      // 3. Update batch request mapping file only after contract confirmation and on-chain verification
      try {
        // Only log contract receipt if it exists
        if (typeof receipt !== 'undefined') {
          console.log('[DEBUG] Contract receipt:', receipt);
        }
        // Verify on-chain existence before writing mapping
        const { drugSupplyChainContract } = await import('../config/blockchain.js');
        const req = await drugSupplyChainContract.batchRequests(chainRequestId);
        console.log(`[DEBUG] batchRequests(${chainRequestId}):`, req);
        if (
          req.requestId &&
          req.requestId.toString() === chainRequestId.toString() &&
          !req.isDeleted &&
          req.requestId.toString() !== '0'
        ) {
          const pathMod = await import('path');
          const fsMod = await import('fs');
          const mappingFile = pathMod.resolve(__dirname, '../../batchrequest_ids.json');
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
            dbBatchRequestId: batchRequest.id,
            contractBatchRequestId: chainRequestId,
            batchId: batch_id,
            requestId: chainRequestId // Always use contract requestId for edit/delete compatibility
          };
          mappings.push(mappingToWrite);
          fsMod.writeFileSync(mappingFile, JSON.stringify(mappings, null, 2));
          console.log('✅ Batch request mapping written:', mappingToWrite);
        } else {
          console.error(`❌ On-chain batch request ${chainRequestId} not found, deleted, or requestId is zero. Mapping not written.`);
        }
      } catch (err) {
        console.error('❌ Failed to update batchrequest_ids.json:', err);
      }
      return batchRequest;
  }

export async function getPharmacistShipments(userId) {
  // Get pharmacist id
  const pharmacistRes = await query("SELECT * FROM pharmacist WHERE userid = $1", [userId]);
  const pharmacist = pharmacistRes.rows[0];
  if (!pharmacist) return [];

  // Query shipments for this pharmacist
  const sql = `
    SELECT s.*, db.batchnumber, dr.name as drugname
    from shipment s
    LEFT JOIN drugbatch db ON s.batch_id = db.id
    LEFT JOIN drug dr ON db.drugid = dr.id
    WHERE s.pharmacist_id = $1
    ORDER BY s.created_at DESC
  `;
  const { rows } = await query(sql, [pharmacist.id]);
  return rows;
}