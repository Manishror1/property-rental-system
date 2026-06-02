// controllers/authController.js
// Design Pattern: Controller separates routing from business logic

const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const logger = require('../utils/logger');

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;

    // Manual validation
    if (!name || name.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Name min 2 characters required.' });
    }
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'Valid email required.' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password min 6 characters.' });
    }
    if (role && !['tenant', 'owner', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role.' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered.' });
    }

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase(),
      password,
      role: role || 'tenant',
      phone,
    });

    const token = generateToken(user._id);
    logger.info(`Auth: New user registered — ${email}`);

    res.status(201).json({
      success: true,
      message: 'Registration successful!',
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    logger.error(`Register Error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error.', detail: error.message });
  }
};
// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      logger.warn(`Auth: Failed login — ${email}`);
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = generateToken(user._id);
    logger.info(`Auth: User logged in — ${email}`);

    res.status(200).json({
      success: true,
      message: 'Login successful!',
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    logger.error(`Login Error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error.', detail: error.message });
  }
};
// GET /api/auth/me
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// PUT /api/auth/update-profile
const updateProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;
    const user = await User.findByIdAndUpdate(req.user.id, { name, phone }, { new: true, runValidators: true });
    res.status(200).json({ success: true, message: 'Profile updated!', user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { register, login, getMe, updateProfile };