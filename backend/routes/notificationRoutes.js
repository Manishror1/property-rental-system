// routes/notificationRoutes.js
const express = require('express');
const router = express.Router();
const { subscribe, getNotifications, markAsRead, testNotification } = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');
const Notification = require('../models/Notification');

router.post('/subscribe', protect, subscribe);
router.get('/', protect, getNotifications);
router.put('/read-all', protect, async (req, res) => {
  try {
    await Notification.updateMany({ recipient: req.user.id, isRead: false }, { isRead: true });
    res.status(200).json({ success: true, message: 'All notifications marked as read.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});
router.put('/:id/read', protect, markAsRead);
router.post('/test', protect, testNotification);

module.exports = router;