const Booking = require('../models/Booking');
const Property = require('../models/Property');
const pushService = require('../services/pushService');
const logger = require('../utils/logger');
const BookingFactory = require('../factories/BookingFactory');

// POST /api/bookings
const createBooking = async (req, res) => {
  try {
    const { propertyId, preferredDate, message } = req.body;

    if (!propertyId || !preferredDate) {
      return res.status(400).json({ success: false, message: 'Property ID and date required.' });
    }

    const property = await Property.findById(propertyId).populate('owner', 'name');
    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found.' });
    }

    // Cannot book own property
    if (property.owner._id.toString() === req.user.id) {
      return res.status(400).json({ success: false, message: 'You cannot book your own property!' });
    }

    // Property must be available
    if (property.status !== 'available') {
      return res.status(400).json({ success: false, message: 'Property is not available for booking.' });
    }

    // ✅ Duplicate check — pending OR approved
    const existing = await Booking.findOne({
      property: propertyId,
      tenant: req.user.id,
      status: { $in: ['pending', 'approved'] }
    });

    if (existing) {
      const msg = existing.status === 'pending'
        ? 'You already have a pending booking request for this property!'
        : 'You already have an approved booking for this property!';
      return res.status(400).json({ success: false, message: msg });
    }

    // Factory Pattern
    const bookingData = BookingFactory.create(
      propertyId,
      req.user.id,
      property.owner._id,
      { preferredDate, message }
    );

    const booking = await Booking.create(bookingData);

    // Observer Pattern — notify owner
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
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    const isOwner = booking.owner.toString() === req.user.id;
    const isTenant = booking.tenant.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isTenant && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    if (isTenant && !isOwner && status !== 'cancelled') {
      return res.status(400).json({ success: false, message: 'You can only cancel your bookings.' });
    }

    if (isOwner && !isTenant && !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'You can only approve or reject.' });
    }

    booking.status = status;
    if (ownerNote) booking.ownerNote = ownerNote;
    await booking.save();

    // Property status auto-update + notifications
    if (status === 'approved') {
      await Property.findByIdAndUpdate(booking.property._id, { status: 'rented' });
      await pushService.notifyBookingApproved(
        booking.tenant,
        booking.property.title,
        booking._id
      );
    }

    if (status === 'rejected') {
      await Property.findByIdAndUpdate(booking.property._id, { status: 'available' });
      await pushService.notifyBookingRejected(
        booking.tenant,
        booking.property.title,
        booking._id
      );
    }

    if (status === 'cancelled') {
      await Property.findByIdAndUpdate(booking.property._id, { status: 'available' });
      const tenant = await require('../models/User').findById(booking.tenant).select('name');
      await pushService.notifyBookingCancelled(
        booking.owner,
        tenant?.name || 'A tenant',
        booking.property.title
      );
    }

    logger.info(`Booking: Status "${status}" by ${req.user.email}`);
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
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

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
  createBooking, getMyBookings, getOwnerBookings,
  getAllBookings, updateBookingStatus, deleteBooking
};