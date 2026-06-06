/**
 * pushService.js — Frontend Push Notification Service
 * Handles: Subscribe to push, Request permission, Auto re-subscribe
 * Pattern: Facade — hides Web Push API complexity
 */

import api from './api';

// ── VAPID Public Key — from .env file ───────────────────────
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

/**
 * Convert VAPID base64 key to Uint8Array
 * Required format for browser PushManager
 */
const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

/**
 * Request notification permission from browser
 * Shows browser popup asking user to allow/deny
 * Returns: 'granted' | 'denied' | 'default'
 */
export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.warn('[Push] Browser does not support notifications');
    return 'denied';
  }
  if (Notification.permission === 'granted') return 'granted';
  const permission = await Notification.requestPermission();
  return permission;
};

/**
 * Subscribe user to push notifications
 * ✅ Always creates fresh subscription — fixes stale subscription bug
 * Saves new subscription to backend DB
 */
export const subscribeToPush = async () => {
  try {
    // Check browser support
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('[Push] Not supported in this browser');
      return false;
    }

    // Request permission — shows Windows "Allow notifications" popup
    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
      console.warn('[Push] Permission denied by user');
      return false;
    }

    // Wait for service worker to be ready
    const registration = await navigator.serviceWorker.ready;

    // ✅ Unsubscribe old subscription first — prevents stale subscription
    const existing = await registration.pushManager.getSubscription();
    if (existing) {
      await existing.unsubscribe();
      console.log('[Push] Old subscription removed');
    }

    // Create fresh subscription with VAPID key
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });

    // Save fresh subscription to backend
    await api.post('/notifications/subscribe', { subscription });
    console.log('[Push] ✅ Fresh subscription saved to backend!');
    return true;

  } catch (error) {
    console.error('[Push] Subscribe failed:', error);
    return false;
  }
};

/**
 * Auto re-subscribe silently — called on dashboard load
 * Only runs if permission already granted — won't show popup
 */
export const autoReSubscribe = async () => {
  try {
    if (Notification.permission !== 'granted') return;
    if (!('serviceWorker' in navigator)) return;

    const registration = await navigator.serviceWorker.ready;
    const existing = await registration.pushManager.getSubscription();

    if (existing) {
      // Just re-save existing subscription to backend
      await api.post('/notifications/subscribe', { subscription: existing });
      console.log('[Push] Auto re-subscribed ✅');
    }
  } catch (error) {
    console.warn('[Push] Auto re-subscribe failed:', error);
  }
};

/**
 * Get all notifications for current user from backend
 */
export const getNotifications = async () => {
  try {
    const res = await api.get('/notifications');
    return res.data.notifications || [];
  } catch (error) {
    console.error('[Push] Get notifications error:', error);
    return [];
  }
};

/**
 * Mark a single notification as read
 */
export const markNotificationRead = async (id) => {
  try {
    await api.put(`/notifications/${id}/read`);
  } catch (error) {
    console.error('[Push] Mark read error:', error);
  }
};