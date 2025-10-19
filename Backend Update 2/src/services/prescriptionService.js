import { query } from "../config/database.js";
import QRCode from "qrcode";

/**
 * 🔹 Generate a QR code as a Base64 image
 * @param {string} data
 * @returns {Promise<string>} Base64 QR code image
 */
export async function generateQrCode(data) {
  try {
    return await QRCode.toDataURL(data, { width: 250 });
  } catch (err) {
    console.error("❌ QR generation error:", err);
    throw new Error("Failed to generate QR code");
  }
}

/**
 * ➕ Create a new prescription (with automatic QR code and status)
 */
export async function createPrescription({
  doctorId,
  patientId,
  drugId,
  dosage,
  frequency,
  duration,
  instructions,
  issueDate,
  validUntil,
}) {
  if (!doctorId || !patientId || !drugId) throw new Error("doctorId, patientId, and drugId are required");
  if (!dosage || !frequency || !duration || !issueDate || !validUntil) {
    throw new Error("Missing required fields for prescription");
  }

  dosage = dosage.trim();
  frequency = frequency.trim();
  instructions = instructions?.trim() || "";
  duration = Number(duration);
  if (isNaN(duration)) throw new Error("Duration must be a number");

  const today = new Date();
  const issueDateObj = new Date(issueDate);
  const validUntilObj = new Date(validUntil);
  if (isNaN(issueDateObj) || isNaN(validUntilObj)) throw new Error("Invalid dates provided");

  let status = "Pending";
  if (today >= issueDateObj && today <= validUntilObj) status = "Active";
  else if (today > validUntilObj) status = "Expired";

  // Step 1: Insert prescription without QR code (we need the ID first)
  const insertText = `
    INSERT INTO prescription
      (doctor_id, patient_id, drug_id, dosage, frequency, duration, instructions, issue_date, valid_until, status)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
    RETURNING *;
  `;
  const insertValues = [
    doctorId,
    patientId,
    drugId,
    dosage,
    frequency,
    duration,
    instructions,
    issueDate,
    validUntil,
    status,
  ];
  const insertResult = await query(insertText, insertValues);
  const prescriptionId = insertResult.rows[0].id;

  // Step 2: Generate QR code with actual prescription ID
  const qrImage = await generateQrCode(`http://localhost:8080/prescription/${prescriptionId}`);

  // Step 3: Update prescription with final QR code
  await query(`UPDATE prescription SET qrcode = $1 WHERE id = $2`, [qrImage, prescriptionId]);

  // Step 4: Return full prescription with patient and drug info
  const result = await query(
    `SELECT 
       p.id, 
       p.doctor_id, 
       p.patient_id, 
       u.full_name AS patient_name, 
       u.dob AS patient_dob, 
       d.name AS drug_name, 
       p.dosage, 
       p.frequency, 
       p.duration, 
       p.instructions, 
       p.issue_date, 
       p.valid_until, 
       p.qrcode, 
       p.status
     FROM prescription p
     JOIN patient pt ON pt.id = p.patient_id
     JOIN users u ON u.id = pt.userid
     JOIN drug d ON d.id = p.drug_id
     WHERE p.id = $1;`,
    [prescriptionId]
  );

  return result.rows[0];
}

/**
 * 📋 Get all prescriptions for a specific doctor
 */
export async function getPrescriptionsByDoctor(doctorId) {
  if (!doctorId) throw new Error("doctorId is required");

  const result = await query(
    `SELECT 
        p.id,
        p.dosage,
        p.frequency,
        p.duration,
        p.instructions,
        p.issue_date,
        p.valid_until,
        p.qrcode,
        p.status,
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

/**
 * 📄 Get a single prescription by ID (doctor only)
 */
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
       p.dosage, 
       p.frequency, 
       p.duration, 
       p.instructions, 
       p.issue_date, 
       p.valid_until, 
       p.qrcode, 
       p.status
     FROM prescription p
     JOIN patient pt ON pt.id = p.patient_id
     JOIN users u ON u.id = pt.userid
     JOIN drug d ON d.id = p.drug_id
     WHERE p.id = $1 AND p.doctor_id = $2;`,
    [id, doctorId]
  );
  return result.rows[0] ?? null;
}

/**
 * ❌ Delete a prescription (doctor only)
 */
export async function deletePrescription(id, doctorId) {
  if (!doctorId) throw new Error("doctorId is required");

  const checkResult = await query(
    `SELECT id FROM prescription WHERE id = $1 AND doctor_id = $2;`,
    [id, doctorId]
  );
  if (checkResult.rowCount === 0) return false;

  await query(`DELETE FROM prescription WHERE id = $1 AND doctor_id = $2;`, [id, doctorId]);
  return true;
}

/**
 * 🔍 Search drugs by name
 */
export async function searchDrugs(queryString) {
  if (!queryString || queryString.trim().length === 0) return [];

  const result = await query(
    `SELECT id, name, code, formulation, dosageunit
     FROM drug
     WHERE LOWER(name) LIKE LOWER($1)
     ORDER BY name ASC
     LIMIT 10;`,
    [`%${queryString.trim()}%`]
  );

  return result.rows ?? [];
}

/**
 * 🔍 Search patients by name or ID
 */
export async function searchPatients(queryString) {
  if (!queryString || queryString.trim().length === 0) return [];

  const cleaned = queryString.trim();
  const isNumeric = /^\d+$/.test(cleaned);

  const result = await query(
    `SELECT 
        p.id AS patient_id, 
        u.id AS user_id, 
        u.full_name, 
        u.phone_number, 
        u.gender, 
        u.dob
     FROM patient p
     JOIN users u ON u.id = p.userid
     WHERE ${isNumeric ? "CAST(p.id AS TEXT) = $1" : "LOWER(u.full_name) LIKE LOWER($1)"}
     ORDER BY u.full_name ASC
     LIMIT 10;`,
    [isNumeric ? cleaned : `%${cleaned}%`]
  );

  return result.rows ?? [];
}

/**
 * 📋 Get recent prescriptions for a doctor
 */
export async function getRecentPrescriptionsService(doctorId, limit = 5) {
  const result = await query(
    `SELECT 
        p.id,
        p.dosage,
        p.frequency,
        p.duration,
        p.instructions,
        p.issue_date,
        p.valid_until,
        p.qrcode,
        p.status,
        pat.id AS patient_id,
        u.full_name AS patient_name,
        d.name AS drug_name
     FROM prescription p
     JOIN patient pat ON pat.id = p.patient_id
     JOIN users u ON u.id = pat.userid
     JOIN drug d ON d.id = p.drug_id
     WHERE p.doctor_id = $1
     ORDER BY p.issue_date DESC
     LIMIT $2;`,
    [doctorId, limit]
  );
  console.log("✅ Recent prescriptions found:", result.rows.length);
  return result.rows ?? [];
}
/**
 * 📋 Get all prescriptions for the logged-in patient
 */
export async function getPatientPrescriptionsService(userId) {
  try {
    // Step 1: Get patient ID using userId
    const patientResult = await query(
      "SELECT id FROM patient WHERE userid = $1",
      [userId]
    );

    if (patientResult.rowCount === 0) {
      console.warn(`⚠️ No patient record found for userId: ${userId}`);
      return [];
    }

    const patientId = patientResult.rows[0].id;

    // Step 2: Fetch prescriptions with doctor & drug info
    const prescriptionsResult = await query(
      `
      SELECT 
        p.id,
        p.dosage,
        p.frequency,
        p.duration,
        p.instructions,
        p.issue_date,
        p.valid_until,
        p.status,
        p.qrcode,
        d.name AS drug_name,
        du.full_name AS doctor_name,
        du.email AS doctor_email,
        du.phone_number AS doctor_phone
      FROM prescription p
      JOIN doctor doc ON p.doctor_id = doc.id
      JOIN users du ON doc.userid = du.id
      JOIN drug d ON p.drug_id = d.id
      WHERE p.patient_id = $1
      ORDER BY p.issue_date DESC
      `,
      [patientId]
    );

    console.log("✅ DB returned prescriptions:", prescriptionsResult.rows);
    return prescriptionsResult.rows;
  } catch (error) {
    console.error("❌ Error in getPatientPrescriptionsService:", error.message);
    throw error;
  }
}