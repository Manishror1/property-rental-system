const express = require('express');
const router = express.Router();
const { subscribe, getNotifications, markAsRead, testNotification } = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

router.post('/subscribe', protect, subscribe);
router.get('/', protect, getNotifications);
router.put('/:id/read', protect, markAsRead);
router.post('/test', protect, testNotification);

module.exports = router;