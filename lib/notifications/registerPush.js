import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import { app } from '@/lib/firebase';

async function postToken(token, platform) {
  await fetch('/api/users/fcm-token', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, provider: 'fcm', platform }),
  });
}

// Requests notification permission, registers the FCM service worker, and
// saves the resulting token server-side. Safe to call multiple times — it's
// a no-op once permission has already been denied, and re-registering the
// same token is an idempotent upsert (see pushTokenService.registerToken).
export async function registerServiceWorkerAndToken() {
  if (typeof window === 'undefined') return { token: null, error: 'Not in browser' };
  if (!('serviceWorker' in navigator) || !('Notification' in window)) {
    return { token: null, error: 'Push not supported in this browser' };
  }
  if (!(await isSupported())) {
    return { token: null, error: 'Firebase Messaging not supported in this browser' };
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return { token: null, error: 'Notification permission denied' };
    }

    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    const messaging = getMessaging(app);
    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    if (!token) return { token: null, error: 'Unable to obtain a push token' };

    await postToken(token, 'web');
    return { token, error: null };
  } catch (error) {
    return { token: null, error: error.message };
  }
}

// Foreground messages (tab open + focused) never trigger the service
// worker's onBackgroundMessage, so the app has to show its own toast.
export function listenForegroundMessages(onNotification) {
  if (typeof window === 'undefined') return () => {};
  let unsubscribe = () => {};
  isSupported().then((supported) => {
    if (!supported) return;
    const messaging = getMessaging(app);
    unsubscribe = onMessage(messaging, (payload) => onNotification(payload));
  });
  return () => unsubscribe();
}
