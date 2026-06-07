const mongoose = require('mongoose');

// models/Notification.js
const NotificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  body: {
    type: String,
    required: true
  },
  type: {
    type: String,
// Notification types for categorization
    enum: [
      'general',
      'booking_request',
      'booking_approved',
      'booking_rejected',
      'booking_cancelled',
      'message',
      'security',
      'account',
      'welcome',
      'test'
    ],
    default: 'general'
  },
  isRead: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('Notification', NotificationSchema);