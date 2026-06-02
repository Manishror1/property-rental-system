// models/Booking.js
const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
  tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  preferredDate: { type: Date, required: [true, 'Preferred date is required'] },
  message: { type: String, maxlength: [500, 'Message max 500 chars'], default: '' },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'cancelled'],
    default: 'pending',
  },
  ownerNote: { type: String, maxlength: [500, 'Note max 500 chars'], default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Booking', BookingSchema);