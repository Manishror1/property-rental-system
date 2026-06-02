// middleware/authMiddleware.js
// JWT Authentication + Role Authorization
// Security - Task 03

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');

// Route protect karta hai - JWT verify karta hai
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized. Please login.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User not found.' });
    }
    logger.info(`Auth: ${req.user.email} (${req.user.role}) authenticated`);
    next();
  } catch (error) {
    logger.error(`Auth Error: ${error.message}`);
    return res.status(401).json({ success: false, message: 'Token invalid or expired.' });
  }
};

// Role check - authorize('admin', 'owner')
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      logger.warn(`Authorization denied: ${req.user.email} tried restricted route`);
      return res.status(403).json({
        success: false,
        message: `Access denied. Role '${req.user.role}' not allowed.`,
      });
    }
    next();
  };
};

module.exports = { protect, authorize };