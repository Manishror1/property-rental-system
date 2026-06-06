const express = require('express');
const router = express.Router();
const {
  createProperty,
  getAllProperties,
  getPropertyById,
  getMyProperties,
  updateProperty,
  deleteProperty
} = require('../controllers/propertyController');
const { protect, authorize } = require('../middleware/authMiddleware');
const Booking = require('../models/Booking');

// Public routes
router.get('/', getAllProperties);
router.get('/my-listings', protect, authorize('user', 'admin'), getMyProperties);
router.get('/:id', getPropertyById);

// ✅ Check if user already booked this property
router.get('/:id/my-booking', protect, async (req, res) => {
  try {
    const booking = await Booking.findOne({
      property: req.params.id,
      tenant: req.user.id,
      status: { $in: ['pending', 'approved'] }
    });
    res.status(200).json({
      success: true,
      hasBooking: !!booking,
      booking: booking || null,
      status: booking?.status || null
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// Protected routes
router.post('/', protect, authorize('user', 'admin'), createProperty);
router.put('/:id', protect, authorize('user', 'admin'), updateProperty);
router.delete('/:id', protect, authorize('user', 'admin'), deleteProperty);

module.exports = router;