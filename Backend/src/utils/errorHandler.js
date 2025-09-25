const logger = require('./logger');

const errorHandler = (err, req, res, next) => {
  logger.error(err.stack || err.message);
  const status = err.statusCode || 500;
  res.status(status).json({ error: err.message || 'Internal server error' });
};

module.exports = errorHandler;
