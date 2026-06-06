// controllers/notificationController.js
const Notification = require('../models/Notification');
const User = require('../models/User');
const webpush = require('web-push');
const logger = require('../utils/logger');

// POST /api/notifications/subscribe
const subscribe = async (req, res) => {
  try {
    const { subscription } = req.body;
    if (!subscription) {
      return res.status(400).json({ success: false, message: 'Subscription required.' });
    }
    await User.findByIdAndUpdate(req.user.id, { pushSubscription: subscription });
    logger.info(`Push: Subscribed — ${req.user.email}`);
    res.status(200).json({ success: true, message: 'Push notifications enabled!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// GET /api/notifications
const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50); // Last 50 notifications
    res.status(200).json({ success: true, notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// PUT /api/notifications/:id/read
const markAsRead = async (req, res) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user.id },
      { isRead: true }
    );
    res.status(200).json({ success: true, message: 'Marked as read.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// POST /api/notifications/test
const testNotification = async (req, res) => {
  try {
    const pushService = require('../services/pushService');
    await pushService.createNotification(
      req.user.id,
      '🧪 Test Notification',
      'Push notifications are working correctly!',
      'test'
    );
    res.status(200).json({ success: true, message: 'Test notification sent!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { subscribe, getNotifications, markAsRead, testNotification };