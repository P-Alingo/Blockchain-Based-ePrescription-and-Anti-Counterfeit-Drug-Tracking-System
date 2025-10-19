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
 * ➕ Create a new prescription (with QR code and automatic status)
 * @param {object} params
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
  if (!doctorId) throw new Error("doctorId is required");
  if (!patientId) throw new Error("patientId is required");
  if (!drugId) throw new Error("drugId is required");
  if (!dosage || !frequency || !duration || !issueDate || !validUntil) {
    throw new Error("Missing required fields for prescription");
  }

  // Clean and normalize inputs
  dosage = dosage.trim();
  frequency = frequency.trim();
  instructions = instructions ? instructions.trim() : "";
  duration = Number(duration);
  if (isNaN(duration)) throw new Error("Duration must be a number");

  // Parse and validate dates
  const today = new Date();
  const issueDateObj = new Date(issueDate);
  const validUntilObj = new Date(validUntil);
  if (isNaN(issueDateObj) || isNaN(validUntilObj)) {
    throw new Error("Invalid dates provided");
  }

  // Determine prescription status
  let status = "Pending";
  if (today >= issueDateObj && today <= validUntilObj) status = "Active";
  else if (today > validUntilObj) status = "Expired";

  // Step 1️⃣: Temporary QR code before ID is known
  let qrImage = await generateQrCode("https://your-frontend-domain.com/prescription/temporary");

  // Step 2️⃣: Insert prescription into database
  const insertText = `
    INSERT INTO prescription
      (doctor_id, patient_id, drug_id, dosage, frequency, duration, instructions, issue_date, valid_until, qrcode, status)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
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
    qrImage,
    status,
  ];

  const insertResult = await query(insertText, insertValues);
  const prescriptionId = insertResult.rows[0].id;

  // Step 3️⃣: Generate final QR code with actual prescription ID
  qrImage = await generateQrCode(`https://your-frontend-domain.com/prescription/${prescriptionId}`);

  // Step 4️⃣: Update the prescription with the final QR code
  await query(`UPDATE prescription SET qrcode = $1 WHERE id = $2`, [qrImage, prescriptionId]);

  // Step 5️⃣: Return the full prescription
  const result = await query(`SELECT id, doctor_id, patient_id, drug_id, dosage, frequency, duration, instructions, issue_date, valid_until, qrcode, status FROM prescription WHERE id = $1;`, [prescriptionId]);
  return result.rows[0];
}

/**
 * 📋 Get all prescriptions for a specific doctor
 */
export async function getPrescriptionsByDoctor(doctorId) {
  if (!doctorId) throw new Error("doctorId is required");

  const result = await query(
    `SELECT id, doctor_id, patient_id, drug_id, dosage, frequency, duration, instructions, issue_date, valid_until, qrcode, status 
     FROM prescription 
     WHERE doctor_id = $1 
     ORDER BY issue_date DESC;`,
    [doctorId]
  );
  return result.rows;
}

/**
 * 📄 Get a single prescription by ID (doctor only)
 */
export async function getPrescriptionById(id, doctorId) {
  if (!doctorId) throw new Error("doctorId is required");

  const result = await query(
    `SELECT id, doctor_id, patient_id, drug_id, dosage, frequency, duration, instructions, issue_date, valid_until, qrcode, status 
     FROM prescription 
     WHERE id = $1 AND doctor_id = $2;`,
    [id, doctorId]
  );
  return result.rows[0];
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

  return result.rows;
}

/**
 * 🔍 Search patients by name or ID (joins users table)
 */
export async function searchPatients(queryString) {
  if (!queryString || queryString.trim().length === 0) return [];

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
     WHERE LOWER(u.full_name) LIKE LOWER($1) OR CAST(p.id AS TEXT) = $2
     ORDER BY u.full_name ASC
     LIMIT 10;`,
    [`%${queryString.trim()}%`, queryString.trim()]
  );

  return result.rows;
}
