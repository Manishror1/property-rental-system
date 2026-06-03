// controllers/bookingController.js
// Design Pattern: Observer Pattern — booking events trigger push notifications

const { validationResult } = require('express-validator');
const Booking = require('../models/Booking');
const Property = require('../models/Property');
const pushService = require('../services/pushService');
const logger = require('../utils/logger');

// POST /api/bookings
const createBooking = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  try {
    const { propertyId, preferredDate, message } = req.body;

    const property = await Property.findById(propertyId).populate('owner', 'name');
    if (!property) return res.status(404).json({ success: false, message: 'Property not found.' });

    // NEW — Apni khud ki property book nahi kar sakte
    if (property.owner._id.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot book your own property!'
      });
    }

    if (property.status !== 'available') {
      return res.status(400).json({ success: false, message: 'Property not available.' });
    }

    const existing = await Booking.findOne({
      property: propertyId,
      tenant: req.user.id,
      status: 'pending'
    });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending booking for this property.'
      });
    }

    const booking = await Booking.create({
      property: propertyId,
      tenant: req.user.id,
      owner: property.owner._id,
      preferredDate,
      message: message || '',
    });

    // Observer Pattern: Owner ko notify karo
    await pushService.notifyBookingRequest(
      property.owner._id,
      req.user.name,
      property.title,
      booking._id
    );

    logger.info(`Booking: New request by ${req.user.email} for "${property.title}"`);
    res.status(201).json({ success: true, message: 'Booking request sent!', booking });
  } catch (error) {
    logger.error(`Create Booking Error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// GET /api/bookings/my-bookings
const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ tenant: req.user.id })
      .populate('property', 'title address city rentPerWeek status')
      .populate('owner', 'name email phone')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: bookings.length, bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// GET /api/bookings/requests
const getOwnerBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ owner: req.user.id })
      .populate('property', 'title address city rentPerWeek')
      .populate('tenant', 'name email phone')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: bookings.length, bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// GET /api/bookings (admin only)
const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('property', 'title city')
      .populate('tenant', 'name email')
      .populate('owner', 'name email')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: bookings.length, bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// PUT /api/bookings/:id/status
const updateBookingStatus = async (req, res) => {
  try {
    const { status, ownerNote } = req.body;
    const booking = await Booking.findById(req.params.id).populate('property', 'title');
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });

    const isOwner = booking.owner.toString() === req.user.id;
    const isTenant = booking.tenant.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isTenant && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    // Tenant sirf cancel kar sakta hai
    if (isTenant && !isOwner && status !== 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'You can only cancel your own bookings.'
      });
    }

    // Owner sirf approve ya reject kar sakta hai
    if (isOwner && !isTenant && !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'You can only approve or reject booking requests.'
      });
    }

    booking.status = status;
    if (ownerNote) booking.ownerNote = ownerNote;
    await booking.save();

    // Observer Pattern: Notify karo
    if (status === 'approved') {
      await pushService.notifyBookingApproved(
        booking.tenant,
        booking.property.title,
        booking._id
      );
    }
    if (status === 'rejected') {
      await pushService.notifyBookingRejected(
        booking.tenant,
        booking.property.title,
        booking._id
      );
    }

    logger.info(`Booking: Status updated to "${status}" by ${req.user.email}`);
    res.status(200).json({ success: true, message: `Booking ${status}!`, booking });
  } catch (error) {
    logger.error(`Update Booking Error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// DELETE /api/bookings/:id
const deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });

    if (booking.tenant.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    await Booking.findByIdAndDelete(req.params.id);
    logger.info(`Booking: Deleted by ${req.user.email}`);
    res.status(200).json({ success: true, message: 'Booking deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = {
  createBooking,
  getMyBookings,
  getOwnerBookings,
  getAllBookings,
  updateBookingStatus,
  deleteBooking
};