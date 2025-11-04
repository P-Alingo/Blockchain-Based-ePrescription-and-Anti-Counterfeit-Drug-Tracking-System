import * as analyticsService from "../services/analyticsService.js";

export async function getGlobalAnalytics(req, res, next) {
  try {
    const metrics = await analyticsService.getGlobalAnalytics();
    res.json(metrics);
  } catch (error) {
    next(error);
  }
}

export async function getAnalyticsByRole(req, res, next) {
  try {
    const metrics = await analyticsService.getAnalyticsByRole(req.params.role);
    res.json(metrics);
  } catch (error) {
    next(error);
  }
}

export async function generateCustomAnalytics(req, res, next) {
  try {
    const report = await analyticsService.generateCustomAnalytics(req.body);
    res.status(201).json(report);
  } catch (error) {
    next(error);
  }
}
