// models/Property.js
const mongoose = require('mongoose');

const PropertySchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title max 100 chars'],
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [1000, 'Description max 1000 chars'],
  },
  address: { type: String, required: [true, 'Address is required'], trim: true },
  city: { type: String, required: [true, 'City is required'], trim: true },
  rentPerWeek: {
    type: Number,
    required: [true, 'Rent per week is required'],
    min: [1, 'Rent must be > 0'],
  },
  bedrooms: { type: Number, required: true, min: [1, 'Min 1 bedroom'] },
  bathrooms: { type: Number, required: true, min: [1, 'Min 1 bathroom'] },
  propertyType: {
    type: String,
    enum: ['house', 'apartment', 'studio', 'townhouse'],
    default: 'house',
  },
  status: {
    type: String,
    enum: ['available', 'rented', 'unavailable'],
    default: 'available',
  },
  amenities: [String],
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('Property', PropertySchema);