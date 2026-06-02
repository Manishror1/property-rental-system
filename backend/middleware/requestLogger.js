// middleware/requestLogger.js
// Har API request ko log karta hai - Task 07 debugging ke liye

const logger = require('../utils/logger');

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