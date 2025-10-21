import * as pharmacistService from "../services/pharmacistService.js";

async function getPharmacistProfile(req, res, next) {
  try {
    const userId = req.user.id;
    const profile = await pharmacistService.getPharmacistByUserId(userId);
    if (!profile) return res.status(404).json({ message: "Pharmacist profile not found" });
    res.json(profile);
  } catch (error) {
    next(error);
  }
}

async function updatePharmacistProfile(req, res, next) {
  try {
    const userId = req.user.id;
    const updateData = req.body;
    const updatedProfile = await pharmacistService.updatePharmacistByUserId(userId, updateData);
    if (!updatedProfile) return res.status(404).json({ message: "Pharmacist profile not found" });
    res.json(updatedProfile);
  } catch (error) {
    next(error);
  }
}

export { getPharmacistProfile, updatePharmacistProfile };
