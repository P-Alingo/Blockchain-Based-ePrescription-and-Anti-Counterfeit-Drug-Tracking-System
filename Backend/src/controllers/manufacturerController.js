import * as manufacturerService from "../services/manufacturerService.js";

async function getManufacturerProfile(req, res, next) {
  try {
    const userId = req.user.id;
    const profile = await manufacturerService.getManufacturerByUserId(userId);
    if (!profile) return res.status(404).json({ message: "Manufacturer profile not found" });
    res.json(profile);
  } catch (error) {
    next(error);
  }
}

async function updateManufacturerProfile(req, res, next) {
  try {
    const userId = req.user.id;
    const updateData = req.body;
    const updatedProfile = await manufacturerService.updateManufacturerByUserId(userId, updateData);
    if (!updatedProfile) return res.status(404).json({ message: "Manufacturer profile not found" });
    res.json(updatedProfile);
  } catch (error) {
    next(error);
  }
}

export { getManufacturerProfile, updateManufacturerProfile };
