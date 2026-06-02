const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { createBooking, getMyBookings, getOwnerBookings, getAllBookings, updateBookingStatus, deleteBooking } = require('../controllers/bookingController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/my-bookings', protect, authorize('tenant'), getMyBookings);
router.get('/requests', protect, authorize('owner'), getOwnerBookings);
router.get('/', protect, authorize('admin'), getAllBookings);

router.post('/',
  protect,
  authorize('tenant'),
  body('propertyId').notEmpty().withMessage('Property ID required'),
  body('preferredDate').isISO8601().withMessage('Valid date required (YYYY-MM-DD)'),
  body('message').optional().isLength({ max: 500 }),
  createBooking
);

router.put('/:id/status', protect, updateBookingStatus);
router.delete('/:id', protect, deleteBooking);

module.exports = router;