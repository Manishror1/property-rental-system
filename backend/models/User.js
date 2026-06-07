const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// models/User.js
const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name min 2 characters'],
    maxlength: [50, 'Name max 50 characters'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password min 6 characters'],
    select: false,
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  phone: { type: String, trim: true },
  pushSubscription: { type: Object, default: null },
  isActive: { type: Boolean, default: true },

  // Google OAuth
  googleId: { type: String, default: null },

  //  Wishlist
  savedProperties: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Property' }],

  //  Account Deletion Request
  deleteRequest: {
    status: {
      type: String,
      enum: ['none', 'pending', 'approved', 'rejected'],
      default: 'none'
    },
    requestedAt: { type: Date, default: null },
    reason: { type: String, default: '' },
    processedAt: { type: Date, default: null },
  },

}, { timestamps: true });

// Password hashing middleware
UserSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  // Google OAuth users ka password hash mat karo
  if (this.password && this.password.startsWith('google_')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare entered password with hashed password
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);