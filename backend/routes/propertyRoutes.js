const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { createProperty, getAllProperties, getPropertyById, getMyProperties, updateProperty, deleteProperty } = require('../controllers/propertyController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', getAllProperties);
router.get('/my-listings', protect, authorize('owner', 'admin'), getMyProperties);
router.get('/:id', getPropertyById);

router.post('/',
  protect,
  authorize('owner'),
  body('title').trim().notEmpty().withMessage('Title required'),
  body('description').trim().notEmpty().withMessage('Description required'),
  body('address').trim().notEmpty().withMessage('Address required'),
  body('city').trim().notEmpty().withMessage('City required'),
  body('rentPerWeek').isNumeric().isFloat({ min: 1 }).withMessage('Valid rent required'),
  body('bedrooms').isInt({ min: 1 }).withMessage('Min 1 bedroom'),
  body('bathrooms').isInt({ min: 1 }).withMessage('Min 1 bathroom'),
  createProperty
);

router.put('/:id', protect, authorize('owner', 'admin'), updateProperty);
router.delete('/:id', protect, authorize('owner', 'admin'), deleteProperty);

module.exports = router;