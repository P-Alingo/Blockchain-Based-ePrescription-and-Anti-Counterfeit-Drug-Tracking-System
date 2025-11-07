export async function deletePharmacistRequest(userId, requestId) {
  // Get pharmacist id
  const pharmacistRes = await query("SELECT * FROM pharmacist WHERE userid = $1", [userId]);
  const pharmacist = pharmacistRes.rows[0];
  if (!pharmacist) throw new Error("Pharmacist not found");
  // Hard delete the request (remove row)
  const sql = `DELETE FROM batch_request WHERE id = $1 AND pharmacist_id = $2 RETURNING *`;
  const { rows } = await query(sql, [requestId, pharmacist.id]);
  if (rows.length === 0) throw new Error("Request not found or not owned by pharmacist");
  return rows[0];
}
import { query } from "../config/database.js";

export async function getPharmacistPrescriptions() {
  // Join prescription, patient, doctor, drug tables for full details
  const sql = `
    SELECT p.id, p.prescription_code, p.status, p.issue_date, p.valid_until, p.dosage_amount, p.dosage_unit, p.frequency, p.duration, p.instructions,
      pa.id as patient_id, u.full_name as patient_name,
      d.id as doctor_id, du.full_name as doctor_name,
      dr.id as drug_id, dr.name as drug_name
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
  return rows.map(p => ({
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
    quantity: 1 // Placeholder, update if you have quantity field
  }));
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
  const invRes = await query("SELECT COUNT(*) FROM inventory WHERE facility_id = $1", [pharmacist.companyid]);
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

export async function dispenseDrug(prescriptionId, patientId, drugId, quantity) {
  // Get prescription details
  const presRes = await query("SELECT * FROM prescription WHERE id = $1", [prescriptionId]);
  const prescription = presRes.rows[0];
  if (!prescription) throw new Error("Prescription not found");
  // Check if prescription is expired
  const nowDate = new Date();
  if (prescription.valid_until && new Date(prescription.valid_until) < nowDate) {
    throw new Error("Prescription is expired. Dispensing not allowed.");
  }
  // Check inventory for the drug
  // Find inventory record for this drug (by drugId and pharmacist's facility)
  // First, get pharmacist by patientId (should be pharmacistId, but keeping signature)
  const pharmacistRes = await query("SELECT * FROM pharmacist WHERE id = $1", [patientId]);
  const pharmacist = pharmacistRes.rows[0];
  if (!pharmacist) throw new Error("Pharmacist not found");
  // Get facility id
  const facilityId = pharmacist.companyid;
  // Find inventory for this drug in this facility
  const invRes = await query(
    `SELECT * FROM inventory WHERE facility_id = $1 AND batch_id IN (SELECT id FROM drugbatch WHERE drugid = $2) AND quantity > 0 ORDER BY quantity DESC`,
    [facilityId, drugId]
  );
  let totalAvailable = 0;
  for (const inv of invRes.rows) {
    totalAvailable += Number(inv.quantity);
  }
  if (totalAvailable < quantity) {
    throw new Error("Insufficient inventory for this drug. Dispensing not allowed.");
  }
  // Decrement inventory from batches (FIFO)
  let qtyToDeduct = quantity;
  for (const inv of invRes.rows) {
    if (qtyToDeduct <= 0) break;
    const deduct = Math.min(qtyToDeduct, Number(inv.quantity));
    await query(
      `UPDATE inventory SET quantity = quantity - $1, last_updated = NOW() WHERE id = $2`,
      [deduct, inv.id]
    );
    qtyToDeduct -= deduct;
  }
  // Update prescription status to 'dispensed', set dispensed_by and dispensed_date
  const now = new Date();
  await query(
    `UPDATE prescription SET status = 'dispensed', dispensed_by = $1, dispensed_date = $2 WHERE id = $3 RETURNING *`,
    [patientId, now, prescriptionId]
  );
  // Return updated prescription
  const { rows } = await query(`SELECT * FROM prescription WHERE id = $1`, [prescriptionId]);
  return rows[0] || {};
}

export async function getPharmacistInventory(userId) {
  // Get pharmacist's facility_id
  const pharmacistRes = await query("SELECT * FROM pharmacist WHERE userid = $1", [userId]);
  const pharmacist = pharmacistRes.rows[0];
  if (!pharmacist) return [];

  // Get facility_id for this pharmacist (via pharmacy_company or direct mapping)
  let facilityId = null;
  const companyRes = await query("SELECT * FROM pharmacy_company WHERE id = $1", [pharmacist.companyid]);
  if (companyRes.rows.length > 0) {
    facilityId = companyRes.rows[0].facility_id;
  }
  if (!facilityId && pharmacist.companyid) facilityId = pharmacist.companyid;
  if (!facilityId) return [];

  // Query all drugs, join with inventory and batches for this facility
  const sql = `
    SELECT dr.id as drug_id, dr.name as drug_name, dr.code as drug_code, dr.formulation, dr.dosageunit,
      db.id as batch_id, db.batchnumber, db.expirydate, db.distributorcompanyid, db.quantity as batch_quantity,
      inv.id as inventory_id, inv.quantity as inventory_quantity, inv.last_updated
    FROM drug dr
    LEFT JOIN drugbatch db ON db.drugid = dr.id
    LEFT JOIN inventory inv ON inv.batch_id = db.id AND inv.facility_id = $1
    WHERE dr.is_deleted = false
    ORDER BY dr.name ASC, db.expirydate ASC
  `;
  const { rows } = await query(sql, [facilityId]);
  // Group by drug, collect batches per drug
  const drugMap = new Map();
  for (const row of rows) {
    if (!drugMap.has(row.drug_id)) {
      drugMap.set(row.drug_id, {
        drug_id: row.drug_id,
        drug_name: row.drug_name,
        drug_code: row.drug_code,
        formulation: row.formulation,
        dosageunit: row.dosageunit,
        batches: [],
        quantity: 0 // will sum below
      });
    }
    // Always add batch if it exists
    if (row.batch_id) {
      drugMap.get(row.drug_id).batches.push({
        batch_id: row.batch_id,
        batch_number: row.batchnumber,
        expiry_date: row.expirydate,
        distributorcompanyid: row.distributorcompanyid,
        batch_quantity: row.batch_quantity !== undefined && row.batch_quantity !== null ? Number(row.batch_quantity) : 0,
        inventory_quantity: row.inventory_quantity !== undefined && row.inventory_quantity !== null ? Number(row.inventory_quantity) : 0,
        inventory_id: row.inventory_id,
        last_updated: row.last_updated
      });
      // Sum up total inventory quantity for this drug
      drugMap.get(row.drug_id).quantity += row.inventory_quantity !== undefined && row.inventory_quantity !== null ? Number(row.inventory_quantity) : 0;
    }
  }
  // Return as array
  return Array.from(drugMap.values());
}


export async function addPharmacistInventory(userId, data) {
  // Get pharmacist
  const pharmacistRes = await query("SELECT * FROM pharmacist WHERE userid = $1", [userId]);
  const pharmacist = pharmacistRes.rows[0];
  if (!pharmacist) return {};
  // Insert inventory
  const { batch_id, quantity } = data;
  const sql = `
    INSERT INTO inventory (batch_id, facility_type, facility_id, quantity, last_updated)
    VALUES ($1, 'pharmacy', $2, $3, NOW())
    RETURNING *
  `;
  const { rows } = await query(sql, [batch_id, pharmacist.companyid, quantity]);
  return rows[0] || {};
}


export async function updatePharmacistInventory(userId, inventoryId, data) {
  // Get pharmacist
  const pharmacistRes = await query("SELECT * FROM pharmacist WHERE userid = $1", [userId]);
  const pharmacist = pharmacistRes.rows[0];
  if (!pharmacist) return {};
  // Update inventory
  const fields = [];
  const values = [inventoryId];
  let idx = 2;
  for (const key in data) {
    fields.push(`${key} = $${idx}`);
    values.push(data[key]);
    idx++;
  }
  if (fields.length === 0) return {};
  const sql = `UPDATE inventory SET ${fields.join(", ")}, last_updated = NOW() WHERE id = $1 RETURNING *`;
  const { rows } = await query(sql, values);
  return rows[0] || {};
}


export async function deletePharmacistInventory(userId, inventoryId) {
  // Soft delete inventory
  const sql = `UPDATE inventory SET quantity = 0, last_updated = NOW() WHERE id = $1 RETURNING *`;
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
  // Get pharmacist
  const pharmacistRes = await query("SELECT * FROM pharmacist WHERE userid = $1", [userId]);
  const pharmacist = pharmacistRes.rows[0];
  if (!pharmacist) return {};

  // Validate drugId, quantity, batchId, distributorId
  const { drugId, quantity, batchId, distributorId } = data;
  if (!drugId || isNaN(Number(drugId)) || !quantity || isNaN(Number(quantity))) {
    throw new Error('Invalid drugId or quantity. Both must be valid integers.');
  }
  // If batchId or distributorId not provided, try to infer from batch
  let batch_id = batchId;
  let distributor_id = distributorId;
  if (!batch_id) {
    // Find batch for this drug with available quantity
    const batchRes = await query(`SELECT id, distributorcompanyid FROM drugbatch WHERE drugid = $1 AND is_deleted = false AND quantity > 0 ORDER BY expirydate ASC LIMIT 1`, [drugId]);
    if (batchRes.rows.length > 0) {
      batch_id = batchRes.rows[0].id;
      distributor_id = batchRes.rows[0].distributorcompanyid;
    }
  }
  // If still missing distributor_id, try to get from batch_id
  if (!distributor_id && batch_id) {
    const batchRes = await query(`SELECT distributorcompanyid FROM drugbatch WHERE id = $1`, [batch_id]);
    if (batchRes.rows.length > 0) distributor_id = batchRes.rows[0].distributorcompanyid;
  }

  const sql = `
    INSERT INTO batch_request (pharmacist_id, drug_id, batch_id, distributor_id, quantity_requested, status, request_date)
    VALUES ($1, $2, $3, $4, $5, 'pending', NOW())
    RETURNING id, drug_id, batch_id, distributor_id, quantity_requested, status, request_date
  `;
  const { rows } = await query(sql, [pharmacist.id, Number(drugId), batch_id, distributor_id, Number(quantity)]);
  return rows[0] || {};
}


export async function getPharmacistDistributors() {
  // Query distributor table
  const sql = `SELECT d.id, d.licenseno, dc.name as company_name FROM distributor d LEFT JOIN distributor_company dc ON d.companyid = dc.id WHERE d.is_deleted = false`;
  const { rows } = await query(sql);
  return rows;
}


export async function getPharmacistShipments(userId) {
  // Get pharmacist id
  const pharmacistRes = await query("SELECT * FROM pharmacist WHERE userid = $1", [userId]);
  const pharmacist = pharmacistRes.rows[0];
  if (!pharmacist) return [];
  // Query shipment table
  const sql = `
    SELECT s.*, db.batchnumber, dr.name as drug_name
    FROM shipment s
    LEFT JOIN drugbatch db ON s.batch_id = db.id
    LEFT JOIN drug dr ON s.drug_id = dr.id
    WHERE s.pharmacist_id = $1 AND (s.is_deleted IS NULL OR s.is_deleted = false)
    ORDER BY s.departure_date DESC
  `;
  const { rows } = await query(sql, [pharmacist.id]);
  return rows;
}


export async function getPharmacistBlockchain(userId) {
  // Get pharmacist id
  const pharmacistRes = await query("SELECT * FROM pharmacist WHERE userid = $1", [userId]);
  const pharmacist = pharmacistRes.rows[0];
  if (!pharmacist) return [];
  // Query blockchaineventlog
  const sql = `SELECT * FROM blockchaineventlog WHERE entityid = $1 AND entitytype = 'pharmacist' ORDER BY timestamp DESC`;
  const { rows } = await query(sql, [pharmacist.id]);
  return rows;
}


export async function getPharmacistAnalytics(userId) {
  // Get pharmacist id
  const pharmacistRes = await query("SELECT * FROM pharmacist WHERE userid = $1", [userId]);
  const pharmacist = pharmacistRes.rows[0];
  if (!pharmacist) return {};
  // Query analytics table for pharmacist
  const sql = `SELECT * FROM analytics WHERE actor_type = 'pharmacist' AND actor_id = $1 ORDER BY recorded_at DESC`;
  const { rows } = await query(sql, [pharmacist.id]);
  return rows;
}
export async function getPharmacistDrugBatches(userId) {
  // Get pharmacist id
  const pharmacistRes = await query("SELECT * FROM pharmacist WHERE userid = $1", [userId]);
  const pharmacist = pharmacistRes.rows[0];
  if (!pharmacist) return [];
  // Query drug batches for this pharmacist
  const sql = `
    SELECT db.*, dr.name as drug_name
    FROM drugbatch db
    LEFT JOIN drug dr ON db.drug_id = dr.id
    WHERE db.pharmacist_id = $1 AND (db.is_deleted IS NULL OR db.is_deleted = false)
    ORDER BY db.created_at DESC
  `;
  const { rows } = await query(sql, [pharmacist.id]);
  return rows;
}