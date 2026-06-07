// middleware/requestLogger.js
// Middleware to log incoming requests and their response status
const logger = require('../utils/logger');

// Middleware function
const requestLogger = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const level = res.statusCode >= 400 ? 'error' : 'info';
    logger[level](`${req.method} ${req.originalUrl} — ${res.statusCode} [${duration}ms]`);
  });
  next();
};

module.exports = requestLogger;