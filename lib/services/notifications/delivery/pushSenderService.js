import axios from 'axios';
import { getAdminMessaging } from '@/lib/auth/user/firebase-admin';
import { removeToken } from '../pushTokenService';

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
  const adminMessaging = await getAdminMessaging();
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

// How many tokens are sent before progress is checkpointed. This is the blast
// radius of a crash: everything in the in-flight batch may be re-sent on the
// retry, nothing before it will be. Smaller = fewer possible duplicates, more
// checkpoint writes.
const CHECKPOINT_BATCH = 100;

/**
 * Sends to whichever providers are present in tokenDocs — a job can fan out to
 * web (fcm) and mobile (expo) in the same call.
 *
 * `tokenDocs` MUST arrive in a stable order (pushTokenService sorts by _id), and
 * batches are walked sequentially rather than fanning both providers out over
 * the whole list at once. That ordering is what makes `onProgress` a meaningful
 * resume point: everything up to and including `lastTokenId` is done, so a retry
 * after a crash resumes instead of re-sending from the top.
 */
export async function sendToTokens(tokenDocs, { title, body, imageUrl, deepLink }, { onProgress } = {}) {
  const totals = { tokensAttempted: 0, sent: 0, failed: 0, invalidRemoved: 0 };
  const empty = { sent: 0, failed: 0, invalidRemoved: 0 };

  for (const batch of chunk(tokenDocs, CHECKPOINT_BATCH)) {
    const fcmTokens = batch.filter((t) => t.provider === 'fcm');
    const expoTokens = batch.filter((t) => t.provider === 'expo');

    const [fcmResult, expoResult] = await Promise.all([
      fcmTokens.length ? sendFcm(fcmTokens, { title, body, imageUrl, deepLink }) : empty,
      expoTokens.length ? sendExpo(expoTokens, { title, body, deepLink }) : empty,
    ]);

    totals.tokensAttempted += batch.length;
    totals.sent += fcmResult.sent + expoResult.sent;
    totals.failed += fcmResult.failed + expoResult.failed;
    totals.invalidRemoved += fcmResult.invalidRemoved + expoResult.invalidRemoved;

    if (onProgress) {
      await onProgress({ lastTokenId: batch[batch.length - 1]._id, totals: { ...totals } });
    }
  }

  return totals;
}
