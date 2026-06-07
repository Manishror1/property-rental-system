const express = require('express');
const router = express.Router();
const { getAllUsers, toggleUserStatus, getDashboardStats, adminDeleteProperty } = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All routes here are protected and require admin role
router.use(protect, authorize('admin'));
router.get('/stats', getDashboardStats);
router.get('/users', getAllUsers);
router.put('/users/:id/toggle', toggleUserStatus);
router.delete('/properties/:id', adminDeleteProperty);

module.exports = router;