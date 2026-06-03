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

// Public routes
router.get('/', getAllProperties);
router.get('/my-listings', protect, authorize('user', 'admin'), getMyProperties);
router.get('/:id', getPropertyById);

// Protected routes
router.post('/', protect, authorize('user', 'admin'), createProperty);
router.put('/:id', protect, authorize('user', 'admin'), updateProperty);
router.delete('/:id', protect, authorize('user', 'admin'), deleteProperty);

module.exports = router;