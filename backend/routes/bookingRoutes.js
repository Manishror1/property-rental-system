const express = require('express');
const router = express.Router();
const {
  createBooking,
  getMyBookings,
  getOwnerBookings,
  getAllBookings,
  updateBookingStatus,
  deleteBooking
} = require('../controllers/bookingController');
const { protect, authorize } = require('../middleware/authMiddleware');

// GET routes
router.get('/my-bookings', protect, authorize('user', 'admin'), getMyBookings);
router.get('/requests', protect, authorize('user', 'admin'), getOwnerBookings);
router.get('/', protect, authorize('admin'), getAllBookings);

// POST — create booking
router.post('/', protect, authorize('user', 'admin'), createBooking);

// PUT — update status
router.put('/:id/status', protect, updateBookingStatus);

// DELETE
router.delete('/:id', protect, deleteBooking);

module.exports = router;