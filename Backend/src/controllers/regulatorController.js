import * as regulatorService from "../services/regulatorService.js";

async function getRegulatorProfile(req, res, next) {
  try {
    const userId = req.user.id;
    const profile = await regulatorService.getRegulatorByUserId(userId);
    if (!profile) return res.status(404).json({ message: "Regulator profile not found" });
    res.json(profile);
  } catch (error) {
    next(error);
  }
}

async function updateRegulatorProfile(req, res, next) {
  try {
    const userId = req.user.id;
    const updateData = req.body;
    const updatedProfile = await regulatorService.updateRegulatorByUserId(userId, updateData);
    if (!updatedProfile) return res.status(404).json({ message: "Regulator profile not found" });
    res.json(updatedProfile);
  } catch (error) {
    next(error);
  }
}

export { getRegulatorProfile, updateRegulatorProfile };
