// Dashboard
async function getDistributorDashboard(req, res, next) {
  try {
    const userId = req.user.id;
    const distributor = await distributorService.getDistributorByUserId(userId);
    if (!distributor) return res.status(404).json({ message: "Distributor not found" });
    const dashboard = await distributorService.getDistributorDashboard(distributor.id);
    res.json(dashboard);
  } catch (error) { next(error); }
}

// Requests
async function getDistributorRequests(req, res, next) {
  try {
    const userId = req.user.id;
    const distributor = await distributorService.getDistributorByUserId(userId);
    if (!distributor) return res.status(404).json({ message: "Distributor not found" });
    const requests = await distributorService.getDistributorRequests(distributor.id);
    res.json(requests);
  } catch (error) { next(error); }
}
async function approveDistributorRequest(req, res, next) {
  try {
    const userId = req.user.id;
    const distributor = await distributorService.getDistributorByUserId(userId);
    if (!distributor) return res.status(404).json({ message: "Distributor not found" });
    const requestId = req.params.id;
    await distributorService.approveDistributorRequest(distributor.id, requestId);
    res.json({ success: true });
  } catch (error) { next(error); }
}
async function rejectDistributorRequest(req, res, next) {
  try {
    const userId = req.user.id;
    const distributor = await distributorService.getDistributorByUserId(userId);
    if (!distributor) return res.status(404).json({ message: "Distributor not found" });
    const requestId = req.params.id;
    await distributorService.rejectDistributorRequest(distributor.id, requestId);
    res.json({ success: true });
  } catch (error) { next(error); }
}

// Shipments
async function getDistributorShipments(req, res, next) {
  try {
    const userId = req.user.id;
    const distributor = await distributorService.getDistributorByUserId(userId);
    if (!distributor) return res.status(404).json({ message: "Distributor not found" });
    const shipments = await distributorService.getDistributorShipments(distributor.id);
    res.json(shipments);
  } catch (error) { next(error); }
}
async function createDistributorShipment(req, res, next) {
  try {
    const userId = req.user.id;
    const distributor = await distributorService.getDistributorByUserId(userId);
    if (!distributor) return res.status(404).json({ message: "Distributor not found" });
    await distributorService.createDistributorShipment(distributor.id, req.body);
    res.json({ success: true });
  } catch (error) { next(error); }
}
async function updateDistributorShipmentStatus(req, res, next) {
  try {
    const userId = req.user.id;
    const distributor = await distributorService.getDistributorByUserId(userId);
    if (!distributor) return res.status(404).json({ message: "Distributor not found" });
    const shipmentId = req.params.id;
    const { status } = req.body;
    await distributorService.updateDistributorShipmentStatus(distributor.id, shipmentId, status);
    res.json({ success: true });
  } catch (error) { next(error); }
}

// Inventory
async function getDistributorInventory(req, res, next) {
  try {
    const userId = req.user.id;
    const distributor = await distributorService.getDistributorByUserId(userId);
    if (!distributor) return res.status(404).json({ message: "Distributor not found" });
    const inventory = await distributorService.getDistributorInventory(distributor.id);
    res.json(inventory);
  } catch (error) { next(error); }
}
async function addDistributorInventory(req, res, next) {
  try {
    const userId = req.user.id;
    const distributor = await distributorService.getDistributorByUserId(userId);
    if (!distributor) return res.status(404).json({ message: "Distributor not found" });
    await distributorService.addDistributorInventory(distributor.id, req.body);
    res.json({ success: true });
  } catch (error) { next(error); }
}

// Blockchain
async function getDistributorBlockchain(req, res, next) {
  try {
    const userId = req.user.id;
    const distributor = await distributorService.getDistributorByUserId(userId);
    if (!distributor) return res.status(404).json({ message: "Distributor not found" });
    const events = await distributorService.getDistributorBlockchain(distributor.id);
    res.json(events);
  } catch (error) { next(error); }
}

// Analytics
async function getDistributorAnalytics(req, res, next) {
  try {
    const userId = req.user.id;
    const distributor = await distributorService.getDistributorByUserId(userId);
    if (!distributor) return res.status(404).json({ message: "Distributor not found" });
    const analytics = await distributorService.getDistributorAnalytics(distributor.id);
    res.json(analytics);
  } catch (error) { next(error); }
}
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

export {
  getDistributorProfile,
  updateDistributorProfile,
  getDistributorDashboard,
  getDistributorRequests,
  approveDistributorRequest,
  rejectDistributorRequest,
  getDistributorShipments,
  createDistributorShipment,
  updateDistributorShipmentStatus,
  getDistributorInventory,
  addDistributorInventory,
  getDistributorBlockchain,
  getDistributorAnalytics
};
