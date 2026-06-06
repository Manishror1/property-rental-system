const express = require('express');
const router = express.Router();
const { sendMessage, getConversations, getMessages, getUnreadCount } = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect); // All routes require login

router.post('/', sendMessage);
router.get('/conversations', getConversations);
router.get('/unread-count', getUnreadCount);
router.get('/:userId', getMessages);

module.exports = router;