// services/pushService.js
// Design Pattern: OBSERVER PATTERN
// Booking events observe karke automatically subscribers ko notify karta hai

const webPush = require('web-push');
const Notification = require('../models/Notification');
const User = require('../models/User');
const logger = require('../utils/logger');

webPush.setVapidDetails(
  process.env.VAPID_EMAIL,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

class PushNotificationService {

  async subscribe(userId, subscription) {
    await User.findByIdAndUpdate(userId, { pushSubscription: subscription });
    logger.info(`Push: User ${userId} subscribed`);
    return { success: true };
  }

  async sendToUser(userId, title, body, type = 'system', relatedBooking = null) {
    try {
      // Notification database me save karo
      const notification = await Notification.create({ recipient: userId, title, body, type, relatedBooking });

      // User ka push subscription get karo
      const user = await User.findById(userId);
      if (user && user.pushSubscription) {
        const payload = JSON.stringify({
          title,
          body,
          icon: '/icons/icon-192x192.png',
          data: { type, bookingId: relatedBooking },
        });
        await webPush.sendNotification(user.pushSubscription, payload);
        logger.info(`Push: Notification sent to user ${userId} — ${title}`);
      }
      return notification;
    } catch (error) {
      if (error.statusCode === 410) {
        // Subscription expire ho gayi — remove karo
        await User.findByIdAndUpdate(userId, { pushSubscription: null });
        logger.warn(`Push: Expired subscription removed for ${userId}`);
      } else {
        logger.error(`Push Error: ${error.message}`);
      }
    }
  }

  async notifyBookingRequest(ownerId, tenantName, propertyTitle, bookingId) {
    return this.sendToUser(ownerId, '🏠 New Booking Request', `${tenantName} wants to view "${propertyTitle}"`, 'booking_request', bookingId);
  }

  async notifyBookingApproved(tenantId, propertyTitle, bookingId) {
    return this.sendToUser(tenantId, '✅ Booking Approved!', `Your request for "${propertyTitle}" is approved!`, 'booking_approved', bookingId);
  }

  async notifyBookingRejected(tenantId, propertyTitle, bookingId) {
    return this.sendToUser(tenantId, '❌ Booking Rejected', `Your request for "${propertyTitle}" was rejected.`, 'booking_rejected', bookingId);
  }
}

module.exports = new PushNotificationService();