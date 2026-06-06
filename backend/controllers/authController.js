// controllers/authController.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');
const pushService = require('../services/pushService');

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;

    if (!name || name.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Name must be at least 2 characters.' });
    }
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'Valid email is required.' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }
    if (role && !['user', 'admin'].includes(role)) {
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
      role: role || 'user',
      phone: phone || '',
    });

    const token = generateToken(user._id);
    logger.info(`Auth: New user registered — ${email} (${user.role})`);

    res.status(201).json({
      success: true,
      message: 'Registration successful!',
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, phone: user.phone },
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
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
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
    logger.info(`Auth: User logged in — ${email} (${user.role})`);

    res.status(200).json({
      success: true,
      message: 'Login successful!',
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, phone: user.phone },
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

    if (!name || name.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Name must be at least 2 characters.' });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name: name.trim(), phone: phone || '' },
      { new: true, runValidators: true }
    );

    logger.info(`Profile updated: ${user.email}`);
    res.status(200).json({ success: true, message: 'Profile updated!', user });
  } catch (error) {
    logger.error(`Update Profile Error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// PUT /api/auth/change-password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Both passwords are required.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
    }
    const user = await User.findById(req.user.id).select('+password');
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
    }
    user.password = newPassword;
    await user.save();

    // ✅ Notification
    await pushService.notifyPasswordChanged(req.user.id);

    logger.info(`Password changed: ${user.email}`);
    res.status(200).json({ success: true, message: 'Password changed successfully!' });
  } catch (error) {
    logger.error(`Change Password Error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};
// PUT /api/auth/wishlist/:propertyId — Toggle wishlist
const toggleWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const propId = req.params.propertyId;

    const index = user.savedProperties.indexOf(propId);
    if (index === -1) {
      user.savedProperties.push(propId);
    } else {
      user.savedProperties.splice(index, 1);
    }

    await user.save();
    const isSaved = user.savedProperties.includes(propId);
    res.status(200).json({ success: true, isSaved, savedProperties: user.savedProperties });
  } catch (error) {
    logger.error(`Toggle Wishlist Error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// GET /api/auth/wishlist — Get saved properties
const getWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate({
      path: 'savedProperties',
      model: 'Property',
      select: 'title address city rentPerWeek bedrooms bathrooms propertyType status owner',
    });
    res.status(200).json({ success: true, savedProperties: user.savedProperties || [] });
  } catch (error) {
    logger.error(`Get Wishlist Error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { register, login, getMe, updateProfile, changePassword, toggleWishlist, getWishlist };