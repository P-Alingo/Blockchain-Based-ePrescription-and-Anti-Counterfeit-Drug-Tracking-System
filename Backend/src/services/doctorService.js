// UPDATE prescription logic
import {
  createPrescriptionOnChain,
  deletePrescriptionOnChain,
  updatePrescriptionBlockchainTxOnChain,
  viewPrescriptionOnChain
} from "./blockchainService.js";
import { query } from "../config/database.js";

// Expose query helper for doctorController dashboard logic
export { query };

// Prescription CRUD and search logic
export async function createPrescription({
  doctorId,
  patientId,
  drugId,
  dosageAmount,
  dosageUnit,
  frequency,
  duration,
  instructions,
  issueDate,
  validUntil,
  quantity,
  patientWalletAddress // <-- Add this field for blockchain
}) {
  if (!doctorId || !patientId || !drugId) throw new Error("doctorId, patientId, and drugId are required");
  if (!dosageAmount || !dosageUnit || !frequency || !duration || !issueDate || !validUntil || !quantity) {
    throw new Error("Missing required fields for prescription");
  }
  dosageAmount = dosageAmount.trim();
  dosageUnit = dosageUnit.trim();
  frequency = frequency.trim();
  instructions = instructions?.trim() || "";
  duration = Number(duration);
  quantity = Number(quantity);
  if (isNaN(duration)) throw new Error("Duration must be a number");
  if (isNaN(quantity)) throw new Error("Quantity must be a number");
  const today = new Date();
  const issueDateObj = new Date(issueDate);
  const validUntilObj = new Date(validUntil);
  if (isNaN(issueDateObj) || isNaN(validUntilObj)) throw new Error("Invalid dates provided");
  let status = "issued";
  if (today > validUntilObj) status = "expired";
  // Generate unique prescription code
  const prescriptionCode = `PRESC-${Math.floor(100000 + Math.random() * 900000)}`;
  const insertText = `
    INSERT INTO prescription
      (patient_id, doctor_id, drug_id, issue_date, valid_until, status, instructions, prescription_code, dosage_amount, dosage_unit, frequency, duration, quantity)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
    RETURNING *;
  `;
  const insertValues = [
    patientId,
    doctorId,
    drugId,
    issueDate,
    validUntil,
    status,
    instructions,
    prescriptionCode,
    dosageAmount,
    dosageUnit,
    frequency,
    duration,
    quantity,
  ];
  const insertResult = await query(insertText, insertValues);
  const prescriptionId = insertResult.rows[0].id;
  const result = await query(
    `SELECT 
       p.id, 
       p.doctor_id, 
       p.patient_id, 
       u.full_name AS patient_name, 
       u.dob AS patient_dob, 
       d.name AS drug_name, 
       p.dosage_amount, 
       p.dosage_unit, 
       p.frequency, 
       p.duration, 
       p.instructions, 
       p.issue_date, 
       p.valid_until, 
       p.status,
       p.prescription_code,
       p.quantity
     FROM prescription p
     JOIN patient pt ON pt.id = p.patient_id
     JOIN users u ON u.id = pt.userid
     JOIN drug d ON d.id = p.drug_id
     WHERE p.id = $1;`,
    [prescriptionId]
  );
  const prescription = result.rows[0];

  // Call blockchain contract to sync prescription
  try {
    const chainParams = {
      databaseId: prescription.id,
      patient: patientWalletAddress, // Must be provided by controller
      prescriptionCode: prescription.prescription_code,
      drugId,
      drugName: prescription.drug_name,
      strength: prescription.dosageAmount + prescription.dosageUnit,
      form: "tablet", // You may want to fetch actual form
      quantity,
      instructions,
      dosageAmount,
      dosageUnit,
      frequency,
      duration,
      validUntil: Math.floor(new Date(validUntil).getTime() / 1000)
    };
    await createPrescriptionOnChain(chainParams);
  } catch (chainErr) {
    console.error("❌ Blockchain prescription creation failed:", chainErr);
    // Optionally: return error or continue
  }

  return prescription;
}

export async function getPrescriptionsByDoctor(doctorId) {
  if (!doctorId) throw new Error("doctorId is required");
  const result = await query(
    `SELECT 
        p.id,
        p.dosage_amount,
        p.dosage_unit,
        p.frequency,
        p.duration,
        p.instructions,
        p.issue_date,
        p.valid_until,
        p.status,
        p.quantity,
        pat.id AS patient_id,
        u.full_name AS patient_name,
        u.dob AS patient_dob,
        d.name AS drug_name
     FROM prescription p
     JOIN patient pat ON pat.id = p.patient_id
     JOIN users u ON u.id = pat.userid
     JOIN drug d ON d.id = p.drug_id
     WHERE p.doctor_id = $1
     ORDER BY p.issue_date DESC;`,
    [doctorId]
  );
  return result.rows ?? [];
}

export async function getPrescriptionById(id, doctorId) {
  if (!doctorId) throw new Error("doctorId is required");
  const result = await query(
    `SELECT 
       p.id, 
       p.doctor_id, 
       p.patient_id, 
       u.full_name AS patient_name, 
       u.dob AS patient_dob, 
       d.name AS drug_name, 
       p.dosage_amount, 
       p.dosage_unit, 
       p.frequency, 
       p.duration, 
       p.instructions, 
       p.issue_date, 
       p.valid_until, 
       p.status,
       p.quantity
     FROM prescription p
     JOIN patient pt ON pt.id = p.patient_id
     JOIN users u ON u.id = pt.userid
     JOIN drug d ON d.id = p.drug_id
     WHERE p.id = $1 AND p.doctor_id = $2;`,
    [id, doctorId]
  );
  const prescription = result.rows[0] ?? null;
  // Blockchain: log view event
  try {
    await viewPrescriptionOnChain(id);
  } catch (chainErr) {
    console.error("❌ Blockchain prescription view failed:", chainErr);
  }
  return prescription;
}

export async function deletePrescription(id, doctorId) {
  if (!doctorId) throw new Error("doctorId is required");
  const checkResult = await query(
    `SELECT id FROM prescription WHERE id = $1 AND doctor_id = $2;`,
    [id, doctorId]
  );
  const deleted = checkResult.rowCount !== 0;
  if (deleted) {
    await query(`DELETE FROM prescription WHERE id = $1 AND doctor_id = $2;`, [id, doctorId]);
    // Call blockchain contract to delete prescription
    try {
      await deletePrescriptionOnChain(id);
    } catch (chainErr) {
      console.error("❌ Blockchain prescription delete failed:", chainErr);
      // Optionally: return error or continue
    }
  }
  return deleted;
}

export async function updatePrescription(id, doctorId, updateData) {
  if (!doctorId) throw new Error("doctorId is required");
  // Only allow update of editable fields
  const allowed = ["dosageAmount", "dosageUnit", "frequency", "duration", "instructions"];
  const keys = Object.keys(updateData).filter(k => allowed.includes(k));
  if (keys.length === 0) return false;
  const setClause = keys.map((k, i) => `${snakeCase(k)} = $${i + 3}`).join(", ");
  const values = [id, doctorId, ...keys.map(k => updateData[k])];
  // Only update if prescription belongs to doctor
  const checkResult = await query(`SELECT id FROM prescription WHERE id = $1 AND doctor_id = $2;`, [id, doctorId]);
  const updated = checkResult.rowCount !== 0;
  if (updated) {
    await query(`UPDATE prescription SET ${setClause} WHERE id = $1 AND doctor_id = $2`, values);
    // Optionally: update blockchain tx hash or other info
    try {
      // If you have a blockchainTx to update, call updatePrescriptionBlockchainTxOnChain
      // await updatePrescriptionBlockchainTxOnChain(id, "newTxHash");
    } catch (chainErr) {
      console.error("❌ Blockchain prescription update failed:", chainErr);
    }
  }
  return updated;
}

// Helper to convert camelCase to snake_case
function snakeCase(str) {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

// In doctorService.js - getDoctorAnalytics function
export async function getDoctorAnalytics(doctorId) {
  if (!doctorId) throw new Error("doctorId is required");
  
  console.log('Fetching analytics for doctorId:', doctorId);

  // Stat cards - SIMPLIFIED VERSION
  const statCardsResult = await query(
    `SELECT 
        COUNT(*) AS total_prescriptions,
        COUNT(*) FILTER (WHERE issue_date >= CURRENT_DATE - INTERVAL '30 days') AS last_30_days,
        COUNT(DISTINCT patient_id) AS unique_patients,
        MIN(issue_date) AS first_prescription,
        MAX(issue_date) AS last_prescription
     FROM prescription
     WHERE doctor_id = $1;`,
    [doctorId]
  );

  // Calculate averages more reliably
  let avg_per_month = 0;
  let avg_per_week = 0;
  const stats = statCardsResult.rows[0];
  
  if (stats && stats.total_prescriptions > 0 && stats.first_prescription && stats.last_prescription) {
    const first = new Date(stats.first_prescription);
    const last = new Date(stats.last_prescription);
    
    // Calculate months and weeks between first and last prescription
    const months = (last.getFullYear() - first.getFullYear()) * 12 + 
                   (last.getMonth() - first.getMonth()) + 1; // +1 to include both months
    const weeks = Math.ceil((last - first) / (1000 * 60 * 60 * 24 * 7)) + 1; // +1 to include both weeks
    
    avg_per_month = months > 0 ? Math.round(stats.total_prescriptions / months) : stats.total_prescriptions;
    avg_per_week = weeks > 0 ? Math.round(stats.total_prescriptions / weeks) : stats.total_prescriptions;
  }

  // Monthly Prescription Trends
  const monthlyTrendsResult = await query(
    `SELECT 
        TO_CHAR(issue_date, 'YYYY-MM') AS month, 
        COUNT(*) AS count
     FROM prescription
     WHERE doctor_id = $1
     GROUP BY TO_CHAR(issue_date, 'YYYY-MM')
     ORDER BY month DESC
     LIMIT 12;`,
    [doctorId]
  );

  // Prescription Status Breakdown
  const statusBreakdownResult = await query(
    `SELECT status, COUNT(*) AS count
     FROM prescription
     WHERE doctor_id = $1
     GROUP BY status
     ORDER BY count DESC;`,
    [doctorId]
  );

  // Top Prescribed Drugs
  const topDrugsResult = await query(
    `SELECT d.name AS drug_name, COUNT(*) AS count
     FROM prescription p
     JOIN drug d ON d.id = p.drug_id
     WHERE p.doctor_id = $1
     GROUP BY d.id, d.name
     ORDER BY count DESC
     LIMIT 5;`,
    [doctorId]
  );

  // Unique Patients per Month
  const patientTrendsResult = await query(
    `SELECT 
        TO_CHAR(issue_date, 'YYYY-MM') AS month, 
        COUNT(DISTINCT patient_id) AS count
     FROM prescription
     WHERE doctor_id = $1
     GROUP BY TO_CHAR(issue_date, 'YYYY-MM')
     ORDER BY month DESC
     LIMIT 12;`,
    [doctorId]
  );

  return {
    statCards: {
      total_prescriptions: stats?.total_prescriptions ?? 0,
      last_30_days: stats?.last_30_days ?? 0,
      unique_patients: stats?.unique_patients ?? 0,
      avg_per_month,
      avg_per_week
    },
    monthlyTrends: monthlyTrendsResult.rows,
    statusBreakdown: statusBreakdownResult.rows,
    topDrugs: topDrugsResult.rows,
    patientTrends: patientTrendsResult.rows
  };
}

// Get all expired prescriptions for a doctor
export async function getExpiredPrescriptions(doctorId) {
  if (!doctorId) throw new Error("doctorId is required");
  const result = await query(
    `SELECT * FROM prescription WHERE doctor_id = $1 AND status = 'expired' ORDER BY issue_date DESC;`,
    [doctorId]
  );
  return result.rows ?? [];
}

// Search drugs by name or other criteria
export async function searchDrugs(queryStr) {
  if (!queryStr || queryStr.trim().length < 1) return [];
  const result = await query(
    `SELECT id, name, form, strength FROM drug WHERE LOWER(name) LIKE LOWER($1) LIMIT 20;`,
    [`%${queryStr.trim()}%`]
  );
  return result.rows ?? [];
}

// Search patients by name or other criteria
export async function searchPatients(queryStr) {
  if (!queryStr || queryStr.trim().length < 1) return [];
  const result = await query(
    `SELECT pt.id, u.full_name, u.dob, u.gender, u.phone, u.email
     FROM patient pt
     JOIN users u ON u.id = pt.userid
     WHERE LOWER(u.full_name) LIKE LOWER($1) OR u.phone LIKE $1 OR u.email LIKE $1
     LIMIT 20;`,
    [`%${queryStr.trim()}%`]
  );
  return result.rows ?? [];
}