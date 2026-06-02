// controllers/propertyController.js
// Design Pattern: Repository Pattern — data access logic controller me isolated hai

const { validationResult } = require('express-validator');
const Property = require('../models/Property');
const logger = require('../utils/logger');

// POST /api/properties
const createProperty = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  try {
    const property = await Property.create({ ...req.body, owner: req.user.id });
    logger.info(`Property: Created "${property.title}" by ${req.user.email}`);
    res.status(201).json({ success: true, message: 'Property listed!', property });
  } catch (error) {
    logger.error(`Create Property Error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// GET /api/properties
const getAllProperties = async (req, res) => {
  try {
    const { city, minRent, maxRent, bedrooms, propertyType } = req.query;
    const filter = { status: 'available' };

    if (city) filter.city = { $regex: city, $options: 'i' };
    if (bedrooms) filter.bedrooms = parseInt(bedrooms);
    if (propertyType) filter.propertyType = propertyType;
    if (minRent || maxRent) {
      filter.rentPerWeek = {};
      if (minRent) filter.rentPerWeek.$gte = parseInt(minRent);
      if (maxRent) filter.rentPerWeek.$lte = parseInt(maxRent);
    }

    const properties = await Property.find(filter).populate('owner', 'name email phone').sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: properties.length, properties });
  } catch (error) {
    logger.error(`Get Properties Error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// GET /api/properties/:id
const getPropertyById = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id).populate('owner', 'name email phone');
    if (!property) return res.status(404).json({ success: false, message: 'Property not found.' });
    res.status(200).json({ success: true, property });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// GET /api/properties/my-listings
const getMyProperties = async (req, res) => {
  try {
    const properties = await Property.find({ owner: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: properties.length, properties });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// PUT /api/properties/:id
const updateProperty = async (req, res) => {
  try {
    let property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ success: false, message: 'Property not found.' });

    if (property.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    property = await Property.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    logger.info(`Property: Updated "${property.title}"`);
    res.status(200).json({ success: true, message: 'Property updated!', property });
  } catch (error) {
    logger.error(`Update Property Error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// DELETE /api/properties/:id
const deleteProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ success: false, message: 'Property not found.' });

    if (property.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    await Property.findByIdAndDelete(req.params.id);
    logger.info(`Property: Deleted by ${req.user.email}`);
    res.status(200).json({ success: true, message: 'Property deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { createProperty, getAllProperties, getPropertyById, getMyProperties, updateProperty, deleteProperty };