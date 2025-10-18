import {
  createPrescription as createPrescriptionService,
  getPrescriptionsByDoctor,
  getPrescriptionById,
  deletePrescription as deletePrescriptionService,
} from "../services/prescriptionService.js";
import { query } from "../config/database.js";

/**
 * 🔍 Search patients by name or ID
 */
export async function searchPatients(req, res) {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
      return res.status(400).json({ message: "Please provide a valid search query" });
    }

    const sql = `
      SELECT id, fullname, age, gender, phone_number
      FROM patient
      WHERE fullname ILIKE $1 OR CAST(id AS TEXT) = $2
      LIMIT 10;
    `;
    const values = [`%${q}%`, q];
    const { rows } = await query(sql, values);

    return res.status(200).json(rows);
  } catch (error) {
    console.error("❌ Error searching patients:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * ➕ Create new prescription
 */
export async function createPrescription(req, res) {
  try {
    const userId = req.user.id; // users.id from JWT

    // ✅ Get the corresponding doctor.id
    const doctorResult = await query("SELECT id FROM doctor WHERE userid = $1", [userId]);
    if (doctorResult.rowCount === 0) {
      return res.status(404).json({ message: "Doctor profile not found" });
    }
    const doctorId = doctorResult.rows[0].id;

    let {
      patientId,
      drugId,
      dosage,
      frequency,
      duration,
      instructions,
      issueDate,
      validUntil,
    } = req.body;

    // Validate required fields
    if (!patientId || !drugId || !dosage || !frequency || !duration || !issueDate || !validUntil) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Trim strings and ensure numeric values
    dosage = dosage.trim();
    frequency = frequency.trim();
    instructions = instructions ? instructions.trim() : "";
    duration = Number(duration);

    const prescription = await createPrescriptionService({
      doctorId, // now correct doctor.id
      patientId,
      drugId,
      dosage,
      frequency,
      duration,
      instructions,
      issueDate,
      validUntil,
    });

    return res.status(201).json({
      message: "Prescription created successfully",
      prescription,
    });
  } catch (error) {
    console.error("❌ Error creating prescription:", error);
    return res.status(500).json({ message: error.message || "Failed to create prescription" });
  }
}

/**
 * 📋 List prescriptions (for logged-in doctor)
 */
export async function listPrescriptions(req, res) {
  try {
    // get doctor.id for list
    const userId = req.user.id;
    const doctorResult = await query("SELECT id FROM doctor WHERE userid = $1", [userId]);
    if (doctorResult.rowCount === 0) {
      return res.status(404).json({ message: "Doctor profile not found" });
    }
    const doctorId = doctorResult.rows[0].id;

    const prescriptions = await getPrescriptionsByDoctor(doctorId);
    return res.status(200).json(prescriptions);
  } catch (error) {
    console.error("❌ Error listing prescriptions:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * 📄 Get a single prescription (restricted to the doctor)
 */
export async function getPrescription(req, res) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });

    const userId = req.user.id;
    const doctorResult = await query("SELECT id FROM doctor WHERE userid = $1", [userId]);
    if (doctorResult.rowCount === 0) {
      return res.status(404).json({ message: "Doctor profile not found" });
    }
    const doctorId = doctorResult.rows[0].id;

    const prescription = await getPrescriptionById(id, doctorId);
    if (!prescription) {
      return res.status(404).json({ message: "Prescription not found or unauthorized" });
    }

    return res.status(200).json(prescription);
  } catch (error) {
    console.error("❌ Error fetching prescription:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * ❌ Delete prescription (only if owned by the doctor)
 */
export async function deletePrescription(req, res) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });

    const userId = req.user.id;
    const doctorResult = await query("SELECT id FROM doctor WHERE userid = $1", [userId]);
    if (doctorResult.rowCount === 0) {
      return res.status(404).json({ message: "Doctor profile not found" });
    }
    const doctorId = doctorResult.rows[0].id;

    const deleted = await deletePrescriptionService(id, doctorId);
    if (!deleted) {
      return res.status(404).json({ message: "Prescription not found or unauthorized" });
    }

    return res.status(200).json({ message: "Prescription deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting prescription:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * 🔍 Search drugs by name
 */
export async function searchDrugs(req, res) {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 1) return res.status(400).json({ message: "Missing search query" });

    const result = await query(
      `SELECT id, name, code, formulation, dosageunit
       FROM drug
       WHERE LOWER(name) LIKE LOWER($1)
       ORDER BY name ASC
       LIMIT 10;`,
      [`%${q}%`]
    );
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("❌ Error searching drugs:", err);
    res.status(500).json({ message: "Error fetching drug list" });
  }
}
