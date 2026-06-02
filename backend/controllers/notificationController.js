// controllers/notificationController.js

const pushService = require('../services/pushService');
const Notification = require('../models/Notification');
const logger = require('../utils/logger');

// POST /api/notifications/subscribe
const subscribe = async (req, res) => {
  try {
    const { subscription } = req.body;
    if (!subscription) return res.status(400).json({ success: false, message: 'No subscription data.' });
    await pushService.subscribe(req.user.id, subscription);
    res.status(200).json({ success: true, message: 'Push notifications enabled!' });
  } catch (error) {
    logger.error(`Subscribe Error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Failed to subscribe.' });
  }
};

// GET /api/notifications
const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user.id }).sort({ createdAt: -1 }).limit(20);
    res.status(200).json({ success: true, count: notifications.length, notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// PUT /api/notifications/:id/read
const markAsRead = async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
    res.status(200).json({ success: true, message: 'Marked as read.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// POST /api/notifications/test — Postman se test karne ke liye
const testNotification = async (req, res) => {
  try {
    await pushService.sendToUser(req.user.id, '🔔 Test Notification', 'Push notifications working!', 'system');
    res.status(200).json({ success: true, message: 'Test notification sent!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed.' });
  }
};

module.exports = { subscribe, getNotifications, markAsRead, testNotification };