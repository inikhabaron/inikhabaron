import { NextResponse } from 'next/server';

// Served at the well-known path Firebase Web Messaging expects
// (`/firebase-messaging-sw.js`) via a literal-filename route segment, so the
// Firebase config can be sourced from env vars instead of a static public/
// file that would need to be regenerated per environment.
export async function GET() {
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  const body = `
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

firebase.initializeApp(${JSON.stringify(config)});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const notification = payload.notification || {};
  const deepLink = (payload.data && payload.data.deepLink) || '/';
  self.registration.showNotification(notification.title || 'KhabarON', {
    body: notification.body,
    icon: '/android-chrome-192x192.png',
    image: notification.image,
    data: { deepLink },
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const deepLink = (event.notification.data && event.notification.data.deepLink) || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(deepLink) && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(deepLink);
    })
  );
});
`;

  return new NextResponse(body, {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'no-cache',
    },
  });
}
