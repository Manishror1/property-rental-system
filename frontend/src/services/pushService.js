import api from './api';

const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
};

export const subscribeToPush = async () => {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push not supported');
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('Notification permission denied');
      return;
    }

    const { data } = await api.get('/notifications/vapid-key');
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(data.publicKey),
    });

    await api.post('/notifications/subscribe', { subscription });
    console.log('[Push] Subscribed successfully!');
    return subscription;
  } catch (error) {
    console.error('[Push] Subscribe failed:', error);
  }
};

export const getNotifications = async () => {
  const res = await api.get('/notifications');
  return res.data.notifications;
};

export const markNotificationRead = async (id) => {
  await api.put(`/notifications/${id}/read`);
};