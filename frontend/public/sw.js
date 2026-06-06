/**
 * sw.js — Service Worker
 * Handles: Push notifications + Offline support
 * ✅ Windows desktop notifications supported
 */

// ── Install ──────────────────────────────────────────────────
self.addEventListener('install', () => {
  console.log('[SW] Installed ✅');
  // Activate immediately without waiting for old SW to die
  self.skipWaiting();
});

// ── Activate ─────────────────────────────────────────────────
self.addEventListener('activate', () => {
  console.log('[SW] Activated ✅');
  // Take control of all pages immediately
  self.clients.claim();
});

// ── Fetch — skip everything, no interception ─────────────────
// ✅ This prevents API call failures
self.addEventListener('fetch', () => {
  // Do nothing — let all requests pass through normally
});

// ── PUSH — Main Windows Notification Handler ─────────────────
self.addEventListener('push', (event) => {
  console.log('[SW] 🔔 Push received!');

  // Default values
  let title = '🏠 PropRental';
  let body  = 'You have a new notification';
  let type  = 'proprental';

  // Parse data sent from backend pushService.js
  if (event.data) {
    try {
      const data = event.data.json();
      title = data.title || title;
      body  = data.body  || body;
      type  = data.type  || type;
    } catch (e) {
      // If JSON fails, use raw text
      body = event.data.text() || body;
    }
  }

  // ✅ Tag must NEVER be empty — guaranteed with fallback
  const tag = (type && type.trim().length > 0)
    ? type.trim()
    : 'proprental';

  console.log(`[SW] Showing notification: "${title}" — "${body}"`);

  // ✅ showNotification — this is what appears on Windows!
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon:               '/icons/icon-192x192.png',
      badge:              '/icons/icon-192x192.png',
      tag,
      renotify:           true,   // Show even if same tag exists
      requireInteraction: false,  // Auto dismiss
      silent:             false,  // Play sound
      data:               { type },
    })
  );
});

// ── Notification Click — Open app on click ───────────────────
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked, type:', event.notification.data?.type);

  // Close the notification popup
  event.notification.close();

  // Determine which page to open based on notification type
  const type = event.notification.data?.type;
  const urlMap = {
    booking_request:   '/admin',
    booking_approved:  '/dashboard',
    booking_rejected:  '/dashboard',
    booking_cancelled: '/admin',
    message:           '/dashboard',
    security:          '/dashboard',
    account:           '/dashboard',
    welcome:           '/dashboard',
    test:              '/dashboard',
  };
  const target = urlMap[type] || '/dashboard';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((list) => {
        // Focus existing open tab
        for (const client of list) {
          if (client.url.includes(self.location.origin)) {
            client.navigate(target);
            return client.focus();
          }
        }
        // Or open new tab
        return clients.openWindow(target);
      })
  );
});

// ── Notification Close — User dismissed ──────────────────────
self.addEventListener('notificationclose', () => {
  console.log('[SW] Notification dismissed by user');
});