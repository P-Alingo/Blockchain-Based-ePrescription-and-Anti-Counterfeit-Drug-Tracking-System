// Patient analytics controller
export async function getPatientAnalytics(req, res) {
  try {
    const userId = req.user.id;
    const analytics = await patientService.fetchPatientAnalytics(userId);
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to fetch analytics" });
  }
}
// List all prescriptions for patient
export async function getPatientPrescriptions(req, res) {
  try {
    const userId = req.user.id;
    const status = req.query.status;
    const prescriptions = await patientService.fetchPatientPrescriptions(userId, status);
    res.json(prescriptions);
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to fetch prescriptions" });
  }
}

// Get single prescription details
export async function getSinglePrescription(req, res) {
  try {
    // Accept prescriptionNo as string (e.g., 'PRESC-333252')
    const prescriptionNo = req.params.id;
    const details = await patientService.fetchPrescriptionDetailsByNo(prescriptionNo);
    if (!details) return res.status(404).json({ message: "Prescription not found" });
    res.json(details);
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to fetch prescription details" });
  }
}

// Get QR code for prescription
export async function getPrescriptionQRCode(req, res) {
  try {
    const prescriptionId = req.params.id;
    const qrData = await patientService.fetchQRCodeData(prescriptionId);
    if (!qrData) return res.status(404).json({ message: "QR code not found" });
    res.json(qrData);
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to fetch QR code" });
  }
}

// Search prescriptions by drug/doctor
export async function searchPatientPrescriptions(req, res) {
  try {
    const userId = req.user.id;
    const queryStr = req.query.query;
    const results = await patientService.searchPatientPrescriptions(userId, queryStr);
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to search prescriptions" });
  }
}

// Export prescriptions summary (PDF or CSV)
export async function exportPatientPrescriptions(req, res) {
  try {
    const userId = req.user.id;
    const fileBuffer = await patientService.exportPatientPrescriptions(userId);
    res.setHeader('Content-Disposition', 'attachment; filename="prescriptions_summary.pdf"');
    res.setHeader('Content-Type', 'application/pdf');
    res.send(fileBuffer);
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to export prescriptions" });
  }
}
import * as patientService from "../services/patientService.js";
import { query } from "../config/database.js";

async function getPatientProfile(req, res, next) {
  try {
    const userId = req.user.id;
    const profile = await patientService.getPatientByUserId(userId);
    if (!profile) return res.status(404).json({ message: "Patient profile not found" });
    res.json(profile);
  } catch (error) {
    next(error);
  }
}

async function updatePatientProfile(req, res, next) {
  try {
    const userId = req.user.id;
    const updateData = req.body;
    const updatedProfile = await patientService.updatePatientByUserId(userId, updateData);
    if (!updatedProfile) return res.status(404).json({ message: "Patient profile not found" });
    res.json(updatedProfile);
  } catch (error) {
    next(error);
  }
}


// Patient Search (moved from authController)
export const searchPatientsController = async (req, res) => {
  try {
    const { query: searchTerm } = req.query;
    const results = await patientService.searchPatients(searchTerm);
    if (results.length === 0) {
      return res.status(404).json({ message: "No patient found" });
    }
    res.json(results);
  } catch (error) {
    console.error("❌ Error searching patients:", error);
    res.status(500).json({ message: error.message || "Server error during patient search" });
  }
};

async function getPatientDashboard(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const dashboard = await patientService.fetchPatientDashboard(userId);
    res.json(dashboard);
  } catch (err) {
    console.error("❌ getPatientDashboard error:", err);
    res.status(500).json({ message: "Failed to fetch dashboard" });
  }
};

export { getPatientProfile, updatePatientProfile, getPatientDashboard };
