import * as distributorService from "../services/distributorService.js";

async function getDistributorProfile(req, res, next) {
  try {
    const userId = req.user.id;
    const profile = await distributorService.getDistributorByUserId(userId);
    if (!profile) return res.status(404).json({ message: "Distributor profile not found" });
    res.json(profile);
  } catch (error) {
    next(error);
  }
}

async function updateDistributorProfile(req, res, next) {
  try {
    const userId = req.user.id;
    const updateData = req.body;
    const updatedProfile = await distributorService.updateDistributorByUserId(userId, updateData);
    if (!updatedProfile) return res.status(404).json({ message: "Distributor profile not found" });
    res.json(updatedProfile);
  } catch (error) {
    next(error);
  }
}

export { getDistributorProfile, updateDistributorProfile };
