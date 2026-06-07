const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const logger = require('../utils/logger');

// Google OAuth Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL,
}, async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await User.findOne({ email: profile.emails[0].value });

    //if user exists but doesn't have googleId, link it
    if (user) {
      if (!user.googleId) {
        user.googleId = profile.id;
        await user.save();
      }
      logger.info(`Google Auth: Existing user — ${user.email}`);
      return done(null, user);
    }

    // New user - create account
    user = await User.create({
      name: profile.displayName,
      email: profile.emails[0].value,
      googleId: profile.id,
      password: `google_${profile.id}_${Date.now()}`,
      role: 'user',
      isActive: true,
    });

    logger.info(`Google Auth: New user — ${user.email}`);
    return done(null, user);
  } catch (error) {
    logger.error(`Google Auth Error: ${error.message}`);
    return done(error, null);
  }
}));

// Serialize and Deserialize User
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  done(null, user);
});

module.exports = passport;