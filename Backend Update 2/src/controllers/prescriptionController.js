import QRCode from "qrcode";
import {
  getPatientPrescriptionsService,
  createPrescription as createPrescriptionService,
  getPrescriptionsByDoctor,
  getPrescriptionById,
  deletePrescription as deletePrescriptionService,
  searchPatients as searchPatientsService,
  searchDrugs as searchDrugsService,
} from "../services/prescriptionService.js";
import { query } from "../config/database.js";

/**
 * 🔍 Search patients by name or ID
 */
export async function searchPatients(req, res) {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 1) {
      return res.status(400).json({ message: "Missing search query" });
    }

    // Clean the query (remove "ID: 49 — " if present)
    const decoded = decodeURIComponent(q).trim();
    const cleanedQuery = decoded.replace(/ID:\s*\d+\s*—\s*/g, "").trim();

    const patients = await searchPatientsService(cleanedQuery);
    return res.status(200).json(patients);
  } catch (error) {
    console.error("❌ Error searching patients:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}


/**
 * 🔍 Search drugs by name
 */
export async function searchDrugs(req, res) {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 1) {
      return res.status(400).json({ message: "Missing search query" });
    }

    const drugs = await searchDrugsService(q.trim());
    return res.status(200).json(drugs);
  } catch (error) {
    console.error("❌ Error searching drugs:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * ➕ Create a new prescription (auto-generates a QR code)
 */
export async function createPrescription(req, res) {
  try {
    const userId = req.user.id;

    // 1️⃣ Verify doctor exists
    const doctorResult = await query("SELECT id FROM doctor WHERE userid = $1", [userId]);
    if (doctorResult.rowCount === 0) {
      return res.status(404).json({ message: "Doctor profile not found" });
    }
    const doctorId = doctorResult.rows[0].id;

    // 2️⃣ Extract body data
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

    // 3️⃣ Verify patient
    const patientResult = await query("SELECT id FROM patient WHERE id = $1", [patientId]);
    if (patientResult.rowCount === 0) {
      return res.status(404).json({ message: "Patient not found" });
    }
    const patientTableId = patientResult.rows[0].id;

    // 4️⃣ Validate required fields
    if (!patientTableId || !drugId || !dosage || !frequency || !duration || !issueDate || !validUntil) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    dosage = dosage.trim();
    frequency = frequency.trim();
    instructions = instructions ? instructions.trim() : "";
    duration = Number(duration);

    // 5️⃣ Create the prescription
    const prescription = await createPrescriptionService({
      doctorId,
      patientId: patientTableId,
      drugId,
      dosage,
      frequency,
      duration,
      instructions,
      issueDate,
      validUntil,
    });

    // 6️⃣ Generate QR data
    const qrData = JSON.stringify({
      prescription_id: prescription.id,
      patient_id: patientTableId,
      doctor_id: doctorId,
      drug_id: drugId,
      dosage,
      frequency,
      duration,
      instructions,
      issue_date: issueDate,
      valid_until: validUntil,
      status: "Active",
    });

    // Alternatively, encode a verification URL instead of raw JSON:
    // const qrData = `https://eprescribe-kenya.vercel.app/verify/${prescription.id}`;

    // 7️⃣ Generate QR code image (as base64 Data URL)
    const qrCodeImage = await QRCode.toDataURL(qrData, {
      errorCorrectionLevel: "H",
      color: {
        dark: "#166534", // deep green for healthcare theme
        light: "#FFFFFF",
      },
      width: 400,
      margin: 2,
    });

    // 8️⃣ Save QR image in DB
    await query("UPDATE prescription SET qrcode = $1 WHERE id = $2", [qrCodeImage, prescription.id]);

    // 9️⃣ Return the new prescription with QR
    return res.status(201).json({
      message: "Prescription created successfully",
      prescription: { ...prescription, qrcode: qrCodeImage },
    });
  } catch (error) {
    console.error("❌ Error creating prescription:", error);
    return res.status(500).json({ message: error.message || "Failed to create prescription" });
  }
}
export const searchPatientPrescriptions = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim() === "") {
      return res.status(400).json({ message: "Search query is required" });
    }

    // Decode and clean query text
    const decodedQuery = decodeURIComponent(q).trim();
    const cleanedQuery = decodedQuery.replace(/ID:\s*\d+\s*—\s*/g, "").trim();

    // You can now search by name OR numeric ID
    const queryIsNumber = /^\d+$/.test(cleanedQuery);
    let prescriptions;

    if (queryIsNumber) {
      prescriptions = await db.query(
        "SELECT * FROM prescriptions WHERE id = $1",
        [cleanedQuery]
      );
    } else {
      prescriptions = await db.query(
        "SELECT * FROM prescriptions WHERE LOWER(patient_name) LIKE LOWER($1)",
        [`%${cleanedQuery}%`]
      );
    }

    if (prescriptions.rows.length === 0) {
      return res.status(404).json({ message: "No prescriptions found" });
    }

    res.json(prescriptions.rows);
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ message: "Server error while searching prescriptions" });
  }
};

/**
 * 📋 List prescriptions for logged-in doctor
 */
export async function listPrescriptions(req, res) {
  try {
    const userId = req.user.id;
    const doctorResult = await query("SELECT id FROM doctor WHERE userid = $1", [userId]);
    if (doctorResult.rowCount === 0) return res.status(404).json({ message: "Doctor profile not found" });

    const doctorId = doctorResult.rows[0].id;
    const prescriptions = await getPrescriptionsByDoctor(doctorId);

    return res.status(200).json(prescriptions ?? []);
  } catch (error) {
    console.error("❌ Error listing prescriptions:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * 📄 Get a single prescription (restricted to doctor)
 */
export async function getPrescription(req, res) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid prescription ID" });

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
 * ❌ Delete prescription (only if owned by doctor)
 */
export async function deletePrescription(req, res) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid prescription ID" });

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
 * 📋 Get all prescriptions for the logged-in patient
 */
export const getPatientPrescriptions = async (req, res) => {
  try {
    const userId = req.user?.id;
    console.log("🧠 Patient userId:", userId);

    if (!userId) {
      return res
        .status(401)
        .json({ message: "Unauthorized: No user ID found" });
    }

    const prescriptions = await getPatientPrescriptionsService(userId);

    if (!prescriptions || prescriptions.length === 0) {
      console.log("⚠️ No prescriptions found for userId:", userId);
      return res.status(200).json({ prescriptions: [] });
    }

    console.log("✅ Found prescriptions:", prescriptions.length);
    return res.status(200).json({ prescriptions });
  } catch (error) {
    console.error("❌ Error fetching prescriptions:", error.message);
    return res.status(500).json({
      message: "Failed to fetch prescriptions",
      error: error.message,
    });
  }
};
