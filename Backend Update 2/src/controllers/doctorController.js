import * as doctorService from "../services/doctorService.js";

async function getDoctorProfile(req, res, next) {
  try {
    const userId = req.user.id;
    const profile = await doctorService.getDoctorByUserId(userId);
    if (!profile) return res.status(404).json({ message: "Doctor profile not found" });
    res.json(profile);
  } catch (error) {
    next(error);
  }
}

async function updateDoctorProfile(req, res, next) {
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

export { getDoctorProfile, updateDoctorProfile };
