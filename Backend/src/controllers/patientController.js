import * as patientService from "../services/patientService.js";

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

export { getPatientProfile, updatePatientProfile };
