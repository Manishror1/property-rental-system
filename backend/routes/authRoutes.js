// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { register, login, getMe, updateProfile, changePassword,  toggleWishlist, getWishlist } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const passport = require('passport');
const jwt = require('jsonwebtoken');

// Google OAuth
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
  passport.authenticate('google', {
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=google_failed`
  }),
  async (req, res) => {
    try {
      const token = jwt.sign(
        { id: req.user._id },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
      );
      res.redirect(
        `${process.env.FRONTEND_URL}/auth/google/success?token=${token}&name=${encodeURIComponent(req.user.name)}&email=${encodeURIComponent(req.user.email)}&role=${req.user.role}&id=${req.user._id}`
      );
    } catch (error) {
      res.redirect(`${process.env.FRONTEND_URL}/login?error=server_error`);
    }
  }
);
// handle registration and login
router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/update-profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);
router.post('/wishlist/:propertyId', protect, toggleWishlist);
router.get('/wishlist', protect, getWishlist);

module.exports = router;