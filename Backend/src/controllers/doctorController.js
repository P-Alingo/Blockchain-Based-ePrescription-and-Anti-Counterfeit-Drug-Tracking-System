// ...existing code...
import * as doctorService from "../services/doctorService.js";
import {
  createPrescription as createPrescriptionService,
  getPrescriptionsByDoctor,
  getPrescriptionById,
  deletePrescription as deletePrescriptionService,
  updatePrescription as updatePrescriptionService,
  searchPatients as searchPatientsService,
  searchDrugs as searchDrugsService,
  getDoctorAnalytics as getDoctorAnalyticsService,
  getExpiredPrescriptions
} from "../services/doctorService.js";
// UPDATE prescription
export async function updatePrescription(req, res) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid prescription ID" });
    const userId = req.user.id;
    const doctorResult = await query("SELECT id FROM doctor WHERE userid = $1", [userId]);
    if (doctorResult.rowCount === 0) {
      return res.status(404).json({ message: "Doctor profile not found" });
    }
    const doctorId = doctorResult.rows[0].id;
    const {
      dosageAmount,
      dosageUnit,
      frequency,
      duration,
      instructions
    } = req.body;
    const updated = await updatePrescriptionService(id, doctorId, {
      dosageAmount,
      dosageUnit,
      frequency,
      duration,
      instructions
    });
    if (!updated) {
      return res.status(404).json({ message: "Prescription not found or unauthorized" });
    }
    return res.status(200).json({ message: "Prescription updated successfully" });
  } catch (error) {
    console.error("❌ Error updating prescription:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
import { query } from "../config/database.js";

// SEARCH patients
export async function searchPatients(req, res) {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 1) {
      return res.status(400).json({ message: "Missing search query" });
    }
    const decoded = decodeURIComponent(q).trim();
    const cleanedQuery = decoded.replace(/ID:\s*\d+\s*—\s*/g, "").trim();
    const patients = await searchPatientsService(cleanedQuery);
    return res.status(200).json(patients);
  } catch (error) {
    console.error("❌ Error searching patients:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// SEARCH drugs
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

// CREATE prescription
export async function createPrescription(req, res) {
  try {
    const userId = req.user.id;
    const doctorResult = await query("SELECT id FROM doctor WHERE userid = $1", [userId]);
    if (doctorResult.rowCount === 0) {
      return res.status(404).json({ message: "Doctor not found" });
    }
    const doctorId = doctorResult.rows[0].id;
    let {
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
    } = req.body;
    const patientResult = await query("SELECT id FROM patient WHERE id = $1", [patientId]);
    if (patientResult.rowCount === 0) {
      return res.status(404).json({ message: "Patient not found" });
    }
    const patientTableId = patientResult.rows[0].id;
    if (!patientTableId || !drugId || !dosageAmount || !dosageUnit || !frequency || !duration || !issueDate || !validUntil) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    dosageAmount = dosageAmount.toString().trim();
    dosageUnit = dosageUnit.trim();
    frequency = frequency.trim();
    instructions = instructions ? instructions.trim() : "";
    duration = Number(duration);
    // Create prescription with quantity
    const prescription = await createPrescriptionService({
      doctorId,
      patientId: patientTableId,
      drugId,
      dosageAmount,
      dosageUnit,
      frequency,
      duration,
      instructions,
      issueDate,
      validUntil,
      quantity,
    });
    // Return blockchain info if present
    return res.status(201).json({
      message: "Prescription created successfully",
      prescription,
      blockchainTxHash: prescription.blockchainTxHash || null,
      blockchainBlockNumber: prescription.blockchainBlockNumber || null
    });
  } catch (error) {
    console.error("❌ Error creating prescription:", error);
    return res.status(500).json({ message: error.message || "Failed to create prescription" });
  }
}

// LIST prescriptions for doctor
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

// GET single prescription
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

// DELETE prescription
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

export async function getDoctorProfile(req, res, next) {
  try {
    const userId = req.user.id;
    const profile = await query("SELECT * FROM doctor WHERE userid = $1", [userId]);
    if (!profile) return res.status(404).json({ message: "Doctor profile not found" });
    res.json(profile);
  } catch (error) {
    next(error);
  }
}

export async function updateDoctorProfile(req, res, next) {
  try {
    const userId = req.user.id;
    const updateData = req.body;
    const updatedProfile = await doctorService.updateDoctorByUserId(userId, updateData);
    if (!updatedProfile) return res.status(404).json({ message: "Doctor profile not found" });
    res.json(updatedProfile);
  } catch (error) {
    next(error);
  }
}

// Doctor Dashboard - FIXED VERSION
export async function getDoctorDashboard(req, res) {
  try {
    const doctorUserId = req.user?.id;
    if (!doctorUserId) {
      console.warn("❌ No doctorId found in auth middleware");
      return res.status(401).json({ message: "Unauthorized" });
    }

    // First, get the doctor's ID from the users table
    const doctorResult = await query("SELECT id FROM doctor WHERE userid = $1", [doctorUserId]);
    if (doctorResult.rowCount === 0) {
      return res.status(404).json({ message: "Doctor profile not found" });
    }
    const doctorId = doctorResult.rows[0].id;

    console.log('🔍 Doctor ID found:', doctorId);

    // ✅ FIXED: Fetch Stats with proper doctor_id filtering
    const statsQuery = `
      SELECT
        COUNT(*) AS total_prescriptions,
        COUNT(*) FILTER (WHERE status = 'issued') AS active_prescriptions,
        COUNT(*) FILTER (WHERE status = 'dispensed' AND DATE(issue_date) = CURRENT_DATE) AS dispensed_today,
        COUNT(DISTINCT patient_id) AS patients_served
      FROM prescription 
      WHERE doctor_id = $1
    `;
    const statsResult = await query(statsQuery, [doctorId]);
    const stats = statsResult.rows[0] || {
      total_prescriptions: 0,
      active_prescriptions: 0,
      dispensed_today: 0,
      patients_served: 0,
    };

    console.log('📊 Dashboard stats:', stats);

    // ✅ FIXED: Fetch Recent Prescriptions (latest 10) with proper doctor_id filtering
    const prescriptionsQuery = `
      SELECT 
        p.id,
        p.prescription_code,
        u.full_name AS patient_name,
        d.name AS drug_name,
        p.dosage_amount,
        p.dosage_unit,
        p.frequency,
        p.duration,
        p.instructions,
        p.issue_date,
        p.valid_until,
        p.status
      FROM prescription p
      JOIN patient pt ON pt.id = p.patient_id
      JOIN users u ON u.id = pt.userid
      JOIN drug d ON d.id = p.drug_id
      WHERE p.doctor_id = $1
      ORDER BY p.issue_date DESC
      LIMIT 10
    `;
    const prescriptionsResult = await query(prescriptionsQuery, [doctorId]);
    const recentPrescriptions = prescriptionsResult.rows || [];

    console.log('📋 Recent prescriptions count:', recentPrescriptions.length);

    return res.json({
      stats,
      recentPrescriptions,
    });
  } catch (error) {
    console.error("❌ Error fetching doctor dashboard:", error);
    return res.status(500).json({ message: "Unable to fetch dashboard data" });
  }
}

// In doctorController.js - getDoctorAnalytics function
export async function getDoctorAnalytics(req, res) {
  try {
    const userId = req.user.id;
    console.log('🔍 User ID:', userId);
    
    const doctorResult = await query("SELECT id FROM doctor WHERE userid = $1", [userId]);
    if (doctorResult.rowCount === 0) {
      console.log('❌ Doctor profile not found for user:', userId);
      return res.status(404).json({ message: "Doctor profile not found" });
    }
    
    const doctorId = doctorResult.rows[0].id;
    console.log('🔍 Doctor ID:', doctorId);
    
    const analytics = await getDoctorAnalyticsService(doctorId);
    console.log('📊 Analytics result:', JSON.stringify(analytics, null, 2));
    
    return res.status(200).json(analytics);
  } catch (error) {
    console.error("❌ Error fetching doctor analytics:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// LIST expired prescriptions for doctor
export async function listExpiredPrescriptions(req, res) {
  try {
    const userId = req.user.id;
    const doctorResult = await query("SELECT id FROM doctor WHERE userid = $1", [userId]);
    if (doctorResult.rowCount === 0) {
      return res.status(404).json({ message: "Doctor profile not found" });
    }
    const doctorId = doctorResult.rows[0].id;
    const expiredPrescriptions = await getExpiredPrescriptions(doctorId);
    return res.status(200).json(expiredPrescriptions ?? []);
  } catch (error) {
    console.error("❌ Error listing expired prescriptions:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}