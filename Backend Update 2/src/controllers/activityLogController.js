import * as activityLogService from "../services/activityLogService.js";

async function listActivityLogs(req, res, next) {
  try {
    const userId = req.user.id;
    const logs = await activityLogService.getLogsByUserId(userId);
    res.json(logs);
  } catch (error) {
    next(error);
  }
}

export { listActivityLogs };
