// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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
    select: false, // Password kabhi response me nahi aayega
  },
  role: {
    type: String,
    enum: ['tenant', 'owner', 'admin'],
    default: 'tenant',
  },
  phone: { type: String, trim: true },
  pushSubscription: { type: Object, default: null }, // Web Push ke liye
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

// Password hash karo save karne se pehle
UserSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Password compare method
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);