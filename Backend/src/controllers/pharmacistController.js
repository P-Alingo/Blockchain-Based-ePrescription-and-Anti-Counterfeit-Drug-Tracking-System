import * as pharmacistService from "../services/pharmacistService.js";

export async function getPharmacistProfile(req, res, next) {
  try {
    const userId = req.user.id;
    const profile = await pharmacistService.getPharmacistByUserId(userId);
    if (!profile) return res.status(404).json({ message: "Pharmacist profile not found" });
    res.json(profile);
  } catch (error) { next(error); }
}

export async function updatePharmacistProfile(req, res, next) {
  try {
    const userId = req.user.id;
    const updateData = req.body;
    const updatedProfile = await pharmacistService.updatePharmacistByUserId(userId, updateData);
    if (!updatedProfile) return res.status(404).json({ message: "Pharmacist profile not found" });
    res.json(updatedProfile);
  } catch (error) { next(error); }
}

export async function getPharmacistDashboard(req, res, next) {
  try {
    const userId = req.user.id;
    const dashboard = await pharmacistService.getPharmacistDashboard(userId);
    res.json(dashboard);
  } catch (error) { next(error); }
}

export async function verifyPrescription(req, res, next) {
  try {
    const { qrCode } = req.body;
    const result = await pharmacistService.verifyPrescription(qrCode);
    res.json(result);
  } catch (error) { next(error); }
}

export async function dispenseDrug(req, res, next) {
  try {
    const { prescriptionId, patientId, drugId, quantity } = req.body;
    const result = await pharmacistService.dispenseDrug(prescriptionId, patientId, drugId, quantity);
    res.json(result);
  } catch (error) { next(error); }
}

export async function getPharmacistInventory(req, res, next) {
  try {
    const userId = req.user.id;
    const inventory = await pharmacistService.getPharmacistInventory(userId);
    res.json(inventory);
  } catch (error) { next(error); }
}

export async function addPharmacistInventory(req, res, next) {
  try {
    const userId = req.user.id;
    const data = req.body;
    const result = await pharmacistService.addPharmacistInventory(userId, data);
    res.json(result);
  } catch (error) { next(error); }
}

export async function updatePharmacistInventory(req, res, next) {
  try {
    const userId = req.user.id;
    const inventoryId = req.params.id;
    const data = req.body;
    const result = await pharmacistService.updatePharmacistInventory(userId, inventoryId, data);
    res.json(result);
  } catch (error) { next(error); }
}

export async function deletePharmacistInventory(req, res, next) {
  try {
    const userId = req.user.id;
    const inventoryId = req.params.id;
    const result = await pharmacistService.deletePharmacistInventory(userId, inventoryId);
    res.json(result);
  } catch (error) { next(error); }
}

export async function getPharmacistRequests(req, res, next) {
  try {
    const userId = req.user.id;
    const requests = await pharmacistService.getPharmacistRequests(userId);
    res.json(requests);
  } catch (error) { next(error); }
}

export async function createPharmacistRequest(req, res, next) {
  try {
    const userId = req.user.id;
    const data = req.body;
    const result = await pharmacistService.createPharmacistRequest(userId, data);
    res.json(result);
  } catch (error) { next(error); }
}

export async function getPharmacistDistributors(req, res, next) {
  try {
    const distributors = await pharmacistService.getPharmacistDistributors();
    res.json(distributors);
  } catch (error) { next(error); }
}

export async function getPharmacistShipments(req, res, next) {
  try {
    const userId = req.user.id;
    const shipments = await pharmacistService.getPharmacistShipments(userId);
    res.json(shipments);
  } catch (error) { next(error); }
}

export async function getPharmacistBlockchain(req, res, next) {
  try {
    const userId = req.user.id;
    const logs = await pharmacistService.getPharmacistBlockchain(userId);
    res.json(logs);
  } catch (error) { next(error); }
}

export async function getPharmacistAnalytics(req, res, next) {
  try {
    const userId = req.user.id;
    const analytics = await pharmacistService.getPharmacistAnalytics(userId);
    res.json(analytics);
  } catch (error) { next(error); }
}
