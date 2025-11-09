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
import { query } from "../config/database.js";

export async function confirmPharmacistDelivery(userId, shipmentId, status) {
  const pharmacistRes = await query("SELECT * FROM pharmacist WHERE userid = $1", [userId]);
  const pharmacist = pharmacistRes.rows[0];
  if (!pharmacist) throw new Error('Pharmacist not found');

  const shipRes = await query("SELECT * FROM shipment WHERE id = $1", [shipmentId]);
  const shipment = shipRes.rows[0];
  if (!shipment) throw new Error('Shipment not found');

  if (shipment.status !== 'delivered') throw new Error('Shipment must be delivered by distributor first');
  if (status !== 'completed' && status !== 'flagged') throw new Error('Invalid pharmacist status');

  await query("UPDATE shipment SET status = $1, updated_at = NOW() WHERE id = $2", [status, shipmentId]);
  await query("UPDATE batch_request SET status = $1, delivered_date = NOW() WHERE batch_id = $2 AND pharmacist_id = $3", [status, shipment.batch_id, pharmacist.id]);

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
    return { logs: [], stats: { totalDispensed: 0, totalVerified: 0, totalPending: 0, inventoryUpdates: 0, failedDispenses: 0 } };
  }

  const dispensedRes = await query(
    "SELECT COUNT(*) FROM prescription WHERE is_deleted = false AND dispensed_by = $1",
    [pharmacist.id]
  );
  const totalDispensed = parseInt(dispensedRes.rows[0].count, 10);

    const issuedRes = await query(
      "SELECT COUNT(*) FROM prescription WHERE is_deleted = false AND status = 'issued' AND dispensed_by = $1",
      [pharmacist.id]
    );
    const totalIssued = parseInt(issuedRes.rows[0].count, 10);

  // Removed pending status, only use issued and dispensed

  const inventoryRes = await query(
    "SELECT COUNT(*) FROM inventory WHERE facility_id = $1 AND facility_type = 'pharmacy'",
    [pharmacist.companyid]
  );
  const inventoryUpdates = parseInt(inventoryRes.rows[0].count, 10);

  const failedDispenses = 0;

  const logsRes = await query(`
    SELECT p.id, 'prescription_dispensed' AS action, p.dispensed_date AS timestamp, u.full_name AS user, p.prescription_code AS code, p.status, TRUE AS success,
      CONCAT('Prescription dispensed: ', p.prescription_code) AS description
    FROM prescription p
    LEFT JOIN pharmacist ph ON p.dispensed_by = ph.id
    LEFT JOIN users u ON ph.userid = u.id
    WHERE p.is_deleted = false AND p.dispensed_by = $1 AND p.status = 'dispensed'
    UNION ALL
    SELECT p.id, 'prescription_issued' AS action, p.updated_at AS timestamp, u.full_name AS user, p.prescription_code AS code, p.status, TRUE AS success,
      CONCAT('Prescription issued: ', p.prescription_code) AS description
    FROM prescription p
    LEFT JOIN pharmacist ph ON p.dispensed_by = ph.id
    LEFT JOIN users u ON ph.userid = u.id
    WHERE p.is_deleted = false AND p.dispensed_by = $1 AND p.status = 'issued'
    UNION ALL
    SELECT inv.id, 'inventory_updated' AS action, inv.last_updated AS timestamp, u.full_name AS user, NULL AS code, NULL AS status, TRUE AS success,
      CONCAT('Inventory updated: batch ', inv.batch_id) AS description
    FROM inventory inv
    LEFT JOIN pharmacist ph ON inv.facility_id = ph.companyid
    LEFT JOIN users u ON ph.userid = u.id
    WHERE inv.facility_id = $2 AND inv.facility_type = 'pharmacy'
    ORDER BY timestamp DESC
    LIMIT 50
  `, [pharmacist.id, pharmacist.companyid]);

  const logs = logsRes.rows.map(row => ({
    id: row.id,
    action: row.action,
    timestamp: row.timestamp,
    user: row.user,
    code: row.code,
    status: row.status,
    success: row.success,
    description: row.description
  }));
  return {
    logs,
    stats: {
      totalDispensed,
      totalIssued,
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
    `SELECT * FROM inventory WHERE facility_id = $1 AND batch_id IN (SELECT id FROM drugbatch WHERE drugid = $2) AND available_quantity > 0 ORDER BY available_quantity DESC`,
    [facilityId, drugId]
  );
  let totalAvailable = 0;
  for (const inv of invRes.rows) {
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
  if (!pharmacist) {
    console.log('[DEBUG] No pharmacist found for userId:', userId);
    return [];
  }

  // Use pharmacist.companyid directly as facility_id for inventory query
  const facilityId = pharmacist.companyid;
  if (!facilityId) {
    console.log('[DEBUG] No facilityId resolved for pharmacist:', pharmacist);
    return [];
  }
  console.log('[DEBUG] pharmacist:', pharmacist);
  console.log('[DEBUG] facilityId used for inventory query:', facilityId);

  // Query all inventory for this facility, join with drug and batch
  const sql = `
    SELECT inv.id as inventory_id, inv.batch_id, inv.available_quantity, inv.total_batch_quantity, inv.minimum_stock_level, inv.expiry_date, inv.last_updated,
      db.batchnumber, db.expirydate as batch_expiry, db.distributorcompanyid, db.quantity as batch_quantity,
      CASE WHEN inv.drug_id IS NOT NULL THEN inv.drug_id ELSE db.drugid END as drug_id,
      dr.name as drug_name, dr.code as drug_code, dr.formulation, dr.dosageunit
    FROM inventory inv
    LEFT JOIN drugbatch db ON inv.batch_id = db.id
    LEFT JOIN drug dr ON (dr.id = inv.drug_id OR dr.id = db.drugid)
    WHERE inv.facility_id = $1 AND inv.facility_type = 'pharmacy'
    ORDER BY dr.name ASC, db.expirydate ASC
  `;
  const { rows } = await query(sql, [facilityId]);
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
    batch_number: row.batchnumber,
    expiry_date: row.expiry_date || row.batch_expiry,
    distributorcompanyid: row.distributorcompanyid,
    batch_quantity: row.batch_quantity !== undefined && row.batch_quantity !== null ? Number(row.batch_quantity) : 0,
    available_quantity: row.available_quantity !== undefined && row.available_quantity !== null ? Number(row.available_quantity) : 0,
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
      batch_quantity: batch.quantity !== undefined && batch.quantity !== null ? Number(batch.quantity) : 0,
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
  const pharmacistRes = await query("SELECT * FROM pharmacist WHERE userid = $1", [userId]);
  const pharmacist = pharmacistRes.rows[0];
  if (!pharmacist) return {};
  // Insert inventory
  const { batch_id, quantity } = data;
  const sql = `
    INSERT INTO inventory (batch_id, facility_type, facility_id, available_quantity, last_updated)
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
  const sql = `UPDATE inventory SET available_quantity = 0, last_updated = NOW() WHERE id = $1 RETURNING *`;
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
        const batch = batchRes.rows[0];
        if (batch) {
          batch_id = batch.id;
          distributor_id = batch.distributorcompanyid;
        }
      }
      // Insert batch_request
      const sql = `
        INSERT INTO batch_request (pharmacist_id, drug_id, batch_id, distributor_id, quantity_requested, status, request_date)
        VALUES ($1, $2, $3, $4, $5, 'pending', NOW())
        RETURNING *
      `;
      const { rows } = await query(sql, [pharmacist.id, drugId, batch_id, distributor_id, quantity]);
      return rows[0] || {};
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