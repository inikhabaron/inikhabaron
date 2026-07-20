import axios from 'axios';
import { adminMessaging } from '@/lib/auth/user/firebase-admin';
import { removeToken } from './pushTokenService';

function chunk(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) chunks.push(array.slice(i, i + size));
  return chunks;
}

const FCM_INVALID_TOKEN_CODES = new Set([
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
]);

async function sendFcm(tokenDocs, { title, body, imageUrl, deepLink }) {
  let sent = 0;
  let failed = 0;
  let invalidRemoved = 0;

  for (const batch of chunk(tokenDocs, 500)) {
    const message = {
      tokens: batch.map((t) => t.token),
      notification: { title, body, ...(imageUrl ? { imageUrl } : {}) },
      data: { deepLink: deepLink || '/' },
      webpush: { fcmOptions: { link: deepLink || '/' } },
    };

    const result = await adminMessaging.sendEachForMulticast(message);
    sent += result.successCount;
    failed += result.failureCount;

    await Promise.all(
      result.responses.map(async (response, i) => {
        if (response.success) return;
        if (FCM_INVALID_TOKEN_CODES.has(response.error?.code)) {
          await removeToken(batch[i].token);
          invalidRemoved += 1;
        }
      })
    );
  }

  return { sent, failed, invalidRemoved };
}

async function sendExpo(tokenDocs, { title, body, deepLink }) {
  let sent = 0;
  let failed = 0;
  let invalidRemoved = 0;

  for (const batch of chunk(tokenDocs, 100)) {
    const messages = batch.map((t) => ({
      to: t.token,
      title,
      body,
      data: { deepLink: deepLink || '/' },
    }));

    try {
      const response = await axios.post('https://exp.host/--/api/v2/push/send', messages, {
        headers: { 'Content-Type': 'application/json' },
      });
      const tickets = response.data?.data || [];

      await Promise.all(
        tickets.map(async (ticket, i) => {
          if (ticket.status === 'ok') {
            sent += 1;
            return;
          }
          failed += 1;
          if (ticket.details?.error === 'DeviceNotRegistered') {
            await removeToken(batch[i].token);
            invalidRemoved += 1;
          }
        })
      );
    } catch (error) {
      failed += batch.length;
    }
  }

  return { sent, failed, invalidRemoved };
}

// Sends to whichever providers are actually present in tokenDocs — a job
// can fan out to web (fcm) and mobile (expo) tokens in the same call.
export async function sendToTokens(tokenDocs, { title, body, imageUrl, deepLink }) {
  const fcmTokens = tokenDocs.filter((t) => t.provider === 'fcm');
  const expoTokens = tokenDocs.filter((t) => t.provider === 'expo');
  const empty = { sent: 0, failed: 0, invalidRemoved: 0 };

  const [fcmResult, expoResult] = await Promise.all([
    fcmTokens.length ? sendFcm(fcmTokens, { title, body, imageUrl, deepLink }) : empty,
    expoTokens.length ? sendExpo(expoTokens, { title, body, deepLink }) : empty,
  ]);

  return {
    tokensAttempted: tokenDocs.length,
    sent: fcmResult.sent + expoResult.sent,
    failed: fcmResult.failed + expoResult.failed,
    invalidRemoved: fcmResult.invalidRemoved + expoResult.invalidRemoved,
  };
}
