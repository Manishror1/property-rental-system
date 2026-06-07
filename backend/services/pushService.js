// services/pushService.js
// Design Pattern: Observer Pattern

const webpush = require('web-push');
const Notification = require('../models/Notification');
const User = require('../models/User');
const logger = require('../utils/logger');

// VAPID Keys
webpush.setVapidDetails(
  'mailto:admin@proprental.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// ── Core Function: Save to DB + Send Push ──────────────
const createNotification = async (recipientId, title, body, type = 'general') => {
  try {
    // Save to DB
    const notification = await Notification.create({
      recipient: recipientId,
      title, body, type, isRead: false,
    });

    logger.info(`Notification created: [${type}] → ${recipientId}`);

    // Send browser push
    const user = await User.findById(recipientId);

    if (user?.pushSubscription) {
      const payload = JSON.stringify({ title, body, type });

      await webpush.sendNotification(user.pushSubscription, payload)
        .then(() => {
          logger.info(`✅ Push sent to: ${user.email}`);
        })
        .catch(async (err) => {
          logger.warn(`❌ Push failed for ${user.email}: ${err.message}`);

// If subscription is expired or invalid, remove it from DB
          if (err.statusCode === 410 || err.statusCode === 404) {
            await User.findByIdAndUpdate(recipientId, {
              pushSubscription: null
            });
            logger.info(`Removed expired subscription for: ${user.email}`);
          }
        });
    } else {
      logger.warn(`No push subscription for user: ${recipientId}`);
    }

    return notification;
  } catch (error) {
    logger.error(`Notification Error [${type}]: ${error.message}`);
  }
};
   
// ── Booking Notifications ──────────────────────────────

// New booking request — owner notification
const notifyBookingRequest = async (ownerId, tenantName, propertyTitle, bookingId) => {
  return createNotification(
    ownerId,
    '🏠 New Booking Request',
    `${tenantName} wants to view "${propertyTitle}"`,
    'booking_request'
  );
};

// Booking approved — tenant notify booking approved notification
const notifyBookingApproved = async (tenantId, propertyTitle, bookingId) => {
  return createNotification(
    tenantId,
    '✅ Booking Approved!',
    `Your viewing request for "${propertyTitle}" has been approved!`,
    'booking_approved'
  );
};

// Booking rejected — tenant notify booking rejected notification
const notifyBookingRejected = async (tenantId, propertyTitle, bookingId) => {
  return createNotification(
    tenantId,
    '❌ Booking Rejected',
    `Your viewing request for "${propertyTitle}" was not approved this time.`,
    'booking_rejected'
  );
};

// Booking cancelled — owner notify booking cancelled notification
const notifyBookingCancelled = async (ownerId, tenantName, propertyTitle) => {
  return createNotification(
    ownerId,
    '🚫 Booking Cancelled',
    `${tenantName} cancelled their viewing request for "${propertyTitle}"`,
    'booking_cancelled'
  );
};

// ── Account Notifications ──────────────────────────────

// Password change
const notifyPasswordChanged = async (userId) => {
  return createNotification(
    userId,
    '🔒 Password Changed',
    'Your password was successfully changed. If this was not you, please contact support.',
    'security'
  );
};

// Profile updated
const notifyProfileUpdated = async (userId, userName) => {
  return createNotification(
    userId,
    '👤 Profile Updated',
    `Your profile information has been updated successfully.`,
    'account'
  );
};

// New message received
const notifyNewMessage = async (receiverId, senderName, propertyTitle) => {
  return createNotification(
    receiverId,
    `💬 New Message from ${senderName}`,
    propertyTitle
      ? `About property: "${propertyTitle}"`
      : 'You have a new message',
    'message'
  );
};

// Welcome notification
const notifyWelcome = async (userId, userName) => {
  return createNotification(
    userId,
    `🎉 Welcome to PropRental, ${userName}!`,
    'Start by browsing available properties or listing your own.',
    'welcome'
  );
};

module.exports = {
  createNotification,
  notifyBookingRequest,
  notifyBookingApproved,
  notifyBookingRejected,
  notifyBookingCancelled,
  notifyPasswordChanged,
  notifyProfileUpdated,
  notifyNewMessage,
  notifyWelcome,
};