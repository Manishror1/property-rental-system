// utils/logger.js
// Design Pattern: Singleton Pattern - ek hi logger instance use hoti hai
// Task 07 - Troubleshooting & Debugging ke liye

const winston = require('winston');
const path = require('path');
const fs = require('fs');

// logs folder create karo agar nahi hai toh
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir);

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: path.join(logsDir, 'error.log'), level: 'error' }),
    new winston.transports.File({ filename: path.join(logsDir, 'combined.log') }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.printf(({ level, message, timestamp }) => `${timestamp} ${level}: ${message}`)
    ),
  }));
}

module.exports = logger;