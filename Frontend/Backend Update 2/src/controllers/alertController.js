import * as alertService from "../services/alertService.js";

async function listAlerts(req, res, next) {
  try {
    const userId = req.user.id;
    const alerts = await alertService.getAlertsByUserId(userId);
    res.json(alerts);
  } catch (error) {
    next(error);
  }
}

async function markAlertRead(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid alert ID" });
    const updated = await alertService.markAlertRead(id);
    if (!updated) return res.status(404).json({ message: "Alert not found" });
    res.json(updated);
  } catch (error) {
    next(error);
  }
}

export { listAlerts, markAlertRead };
