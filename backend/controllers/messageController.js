const Message = require('../models/Message');
const User = require('../models/User');
const Property = require('../models/Property');
const logger = require('../utils/logger');
const pushService = require('../services/pushService');

// POST /api/messages — Send message
const sendMessage = async (req, res) => {
  try {
    const { receiverId, message, propertyId } = req.body;

    if (!receiverId || !message) {
      return res.status(400).json({ success: false, message: 'Receiver and message required.' });
    }

    if (receiverId === req.user.id) {
      return res.status(400).json({ success: false, message: 'Cannot message yourself.' });
    }

    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Create message
    const newMessage = await Message.create({
      sender: req.user.id,
      receiver: receiverId,
      property: propertyId || null,
      message: message.trim(),
    });

    const populated = await Message.findById(newMessage._id)
      .populate('sender', 'name email')
      .populate('receiver', 'name email')
      .populate('property', 'title');

    // Notify receiver
    const sender = await User.findById(req.user.id).select('name');
    let propertyTitle = null;
    if (propertyId) {
      const prop = await Property.findById(propertyId).select('title');
      propertyTitle = prop?.title || null;
    }

    logger.info(`Sending message notification to: ${receiverId} from: ${sender.name}`);

    await pushService.notifyNewMessage(
      receiverId,
      sender.name,
      propertyTitle
    );

    logger.info(`Message: ${req.user.email} → ${receiver.email}`);
    res.status(201).json({ success: true, message: populated });
  } catch (error) {
    logger.error(`Send Message Error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// GET /api/messages/conversations
const getConversations = async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [{ sender: req.user.id }, { receiver: req.user.id }]
    })
      .populate('sender', 'name email')
      .populate('receiver', 'name email')
      .populate('property', 'title')
      .sort({ createdAt: -1 });

    const conversationsMap = {};

    messages.forEach(msg => {
      const isSender = msg.sender._id.toString() === req.user.id;
      const other = isSender ? msg.receiver : msg.sender;
      const otherId = other._id.toString();

      if (!conversationsMap[otherId]) {
        conversationsMap[otherId] = {
          user: other,
          lastMessage: msg,
          unreadCount: 0,
          property: msg.property,
        };
      }

      if (!msg.isRead && msg.receiver._id.toString() === req.user.id) {
        conversationsMap[otherId].unreadCount++;
      }
    });

    const conversations = Object.values(conversationsMap);
    logger.info(`Conversations fetched for: ${req.user.email}`);
    res.status(200).json({ success: true, conversations });
  } catch (error) {
    logger.error(`Get Conversations Error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// GET /api/messages/:userId
const getMessages = async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { sender: req.user.id, receiver: req.params.userId },
        { sender: req.params.userId, receiver: req.user.id },
      ]
    })
      .populate('sender', 'name email')
      .populate('receiver', 'name email')
      .populate('property', 'title')
      .sort({ createdAt: 1 });

    await Message.updateMany(
      { sender: req.params.userId, receiver: req.user.id, isRead: false },
      { isRead: true }
    );

    logger.info(`Messages fetched: ${req.user.email} ↔ ${req.params.userId}`);
    res.status(200).json({ success: true, count: messages.length, messages });
  } catch (error) {
    logger.error(`Get Messages Error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// GET /api/messages/unread-count
const getUnreadCount = async (req, res) => {
  try {
    const count = await Message.countDocuments({
      receiver: req.user.id,
      isRead: false
    });
    res.status(200).json({ success: true, count });
  } catch (error) {
    logger.error(`Unread Count Error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { sendMessage, getConversations, getMessages, getUnreadCount };