import { logger } from "../config/logger.js";

function errorHandler(err, req, res, next) {
  logger.error(err.stack || err.message || err);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    error: true,
    message: err.message || "Internal Server Error",
  });
}

export { errorHandler };
