const mongoose = require('mongoose');

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
    // ✅ Saare types add karo — yahi problem thi!
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