// models/Notification.js
const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  body: { type: String, required: true },
  type: {
    type: String,
    enum: ['booking_request', 'booking_approved', 'booking_rejected', 'booking_cancelled', 'system'],
    default: 'system',
  },
  relatedBooking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', default: null },
  isRead: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Notification', NotificationSchema);