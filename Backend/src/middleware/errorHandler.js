import logger from "../utils/logger.js";

export default function errorHandler(err, req, res, next) {
  logger.error(err);

  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal server error";

  res.status(statusCode).json({ error: message });
}
