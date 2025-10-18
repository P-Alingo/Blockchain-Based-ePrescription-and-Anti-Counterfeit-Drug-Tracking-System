// services/prescriptionService.js
import { query } from "../config/database.js";
import QRCode from "qrcode";

/**
 * Generate a QR code as a Base64 image
 */
export async function generateQrCode(data) {
  try {
    const qrImage = await QRCode.toDataURL(data, { width: 250 });
    return qrImage;
  } catch (err) {
    console.error("QR generation error:", err);
    throw new Error("Failed to generate QR code");
  }
}

/**
 * Create a new prescription (with QR code generation and automatic status)
 */
export async function createPrescription({
  doctorId, // must be doctor.id
  patientId,
  drugId,
  dosage,
  frequency,
  duration,
  instructions,
  issueDate,
  validUntil,
}) {
  try {
    // Validate required fields
    if (!doctorId) throw new Error("doctorId is required");
    if (!patientId || !drugId || !dosage || !frequency || !duration || !issueDate || !validUntil) {
      throw new Error("Missing required fields for prescription");
    }

    // Step 0️⃣ - Determine status based on current date
    const today = new Date();
    const issueDateObj = new Date(issueDate);
    const validUntilObj = new Date(validUntil);

    let status = "Pending"; // default
    if (!isNaN(issueDateObj.getTime()) && !isNaN(validUntilObj.getTime())) {
      if (today < issueDateObj) status = "Pending";
      else if (today > validUntilObj) status = "Expired";
      else status = "Active";
    }

    // Step 1️⃣ - Generate temporary QR code (will update after getting ID)
    let qrImage = await generateQrCode("https://your-frontend-domain.com/prescription/temporary");

    // Step 2️⃣ - Insert prescription with QR code and status
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
      dosage.trim(),
      frequency.trim(),
      Number(duration),
      instructions ? instructions.trim() : "",
      issueDate,
      validUntil,
      qrImage,
      status, // always non-null
    ];

    const insertResult = await query(insertText, insertValues);
    const prescriptionId = insertResult.rows[0].id;

    // Step 3️⃣ - Generate final QR code with real prescription ID
    qrImage = await generateQrCode(`https://your-frontend-domain.com/prescription/${prescriptionId}`);

    // Step 4️⃣ - Update the record with the final QR code
    const updateText = `
      UPDATE prescription
      SET qrcode = $1
      WHERE id = $2;
    `;
    await query(updateText, [qrImage, prescriptionId]);

    // Step 5️⃣ - Fetch the complete prescription
    const result = await query(`SELECT * FROM prescription WHERE id = $1;`, [prescriptionId]);
    return result.rows[0];
  } catch (err) {
    console.error("❌ Error creating prescription:", err);
    throw err;
  }
}

/**
 * Get all prescriptions by a specific doctor
 */
export async function getPrescriptionsByDoctor(doctorId) {
  if (!doctorId) throw new Error("doctorId is required");
  const text = `
    SELECT *
    FROM prescription
    WHERE doctor_id = $1
    ORDER BY issue_date DESC;
  `;
  const result = await query(text, [doctorId]);
  return result.rows;
}

/**
 * Get a single prescription by ID (restricted to the doctor who issued it)
 */
export async function getPrescriptionById(id, doctorId) {
  if (!doctorId) throw new Error("doctorId is required");
  const text = `
    SELECT *
    FROM prescription
    WHERE id = $1 AND doctor_id = $2;
  `;
  const result = await query(text, [id, doctorId]);
  return result.rows[0];
}

/**
 * Delete a prescription (only if owned by the logged-in doctor)
 */
export async function deletePrescription(id, doctorId) {
  if (!doctorId) throw new Error("doctorId is required");
  const checkText = `
    SELECT id FROM prescription WHERE id = $1 AND doctor_id = $2;
  `;
  const checkResult = await query(checkText, [id, doctorId]);

  if (checkResult.rowCount === 0) return false;

  const deleteText = `DELETE FROM prescription WHERE id = $1;`;
  await query(deleteText, [id]);
  return true;
}

/**
 * Search drugs by name
 */
export async function searchDrugs(queryString) {
  try {
    const result = await query(
      `SELECT id, name, code, formulation, dosageunit
       FROM drug
       WHERE LOWER(name) LIKE LOWER($1)
       ORDER BY name ASC
       LIMIT 10;`,
      [`%${queryString}%`]
    );
    return result.rows;
  } catch (err) {
    console.error("❌ Error searching drugs:", err);
    throw new Error("Failed to fetch drug list");
  }
}
