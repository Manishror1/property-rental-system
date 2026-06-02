// controllers/adminController.js

const User = require('../models/User');
const Property = require('../models/Property');
const Booking = require('../models/Booking');
const logger = require('../utils/logger');

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: users.length, users });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    if (user._id.toString() === req.user.id) return res.status(400).json({ success: false, message: 'Cannot deactivate yourself.' });

    user.isActive = !user.isActive;
    await user.save();
    logger.info(`Admin: ${user.email} set to ${user.isActive ? 'active' : 'inactive'}`);
    res.status(200).json({ success: true, message: `User ${user.isActive ? 'activated' : 'deactivated'}.`, user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const getDashboardStats = async (req, res) => {
  try {
    const [totalUsers, totalProperties, totalBookings, pendingBookings] = await Promise.all([
      User.countDocuments(),
      Property.countDocuments(),
      Booking.countDocuments(),
      Booking.countDocuments({ status: 'pending' }),
    ]);
    res.status(200).json({ success: true, stats: { totalUsers, totalProperties, totalBookings, pendingBookings } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const adminDeleteProperty = async (req, res) => {
  try {
    const property = await Property.findByIdAndDelete(req.params.id);
    if (!property) return res.status(404).json({ success: false, message: 'Property not found.' });
    logger.info(`Admin: Property deleted by ${req.user.email}`);
    res.status(200).json({ success: true, message: 'Property deleted by admin.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { getAllUsers, toggleUserStatus, getDashboardStats, adminDeleteProperty };