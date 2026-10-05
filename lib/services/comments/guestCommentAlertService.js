import { getSystemSettingsCollection } from '@/lib/db/systemSettings';
import { getCommentsCollection } from '@/lib/db/comments';
import { getCollection } from '@/lib/mongodb';
import { COLLECTIONS } from '@/lib/constants/collections';
import { logApiError } from '@/lib/api/errors';
import { REVIEW_SLA_MS, REVIEW_SLA_HOURS } from '@/lib/comments/reviewSla';
import { SITE_URL } from '@/lib/seo/config';
import { getCommentModerationSettings } from '@/lib/services/settings/commentModerationService';

/**
 * Emails the editorial team when guest comments pile up unreviewed.
 *
 * Guest comments go live before anyone has looked at them, so the team has to
 * *know* when the review queue is growing — the admin banner only helps while
 * someone has the Comments tab open. An alert fires when either
 *   - unreviewed guest comments reach the configured threshold, or
 *   - any guest comment has waited past the 24h review window.
 *
 * There is no always-on worker here (the host only runs two daily crons), so
 * the check piggybacks on guest activity: it runs after a guest posts and on
 * public comment loads, rate-limited to once per ALERT_CHECK_INTERVAL_MS and
 * claimed atomically in the settings doc so concurrent requests can't both run
 * it. Once alerted, it stays quiet for ALERT_COOLDOWN_MS, and re-arms as soon
 * as the queue is back under control.
 *
 * Email is infrastructure, and a comment must never fail to post or load
 * because it is down: the mail client is imported lazily (a broken SDK can't
 * break module load of the comment routes — see "Notification architecture" in
 * CLAUDE.md) and runGuestCommentAlertCheck() swallows every error and gives up
 * after a few seconds.
 */

const SETTINGS_ID = 'comment_moderation';

export const ALERT_CHECK_INTERVAL_MS = 5 * 60 * 1000;
export const ALERT_COOLDOWN_MS = 6 * 60 * 60 * 1000;
const ALERT_RUN_TIMEOUT_MS = 5000;

async function defaultSend(message) {
  const { sendEmail } = await import('@/lib/services/newsletter/emailService');
  return sendEmail(message);
}

// Guest comments nobody on the team has acted on yet: live and unreviewed
// (or, defensively, still pending). Soft-deleted ones are no longer a concern.
const UNREVIEWED_GUEST = {
  source: 'guest',
  isDeleted: { $ne: true },
  $or: [
    { status: 'pending' },
    { status: 'approved', reviewedAt: null },
  ],
};

async function countUnreviewedGuest(now, cap) {
  const comments = await getCommentsCollection();

  const [unreviewed, overdue] = await Promise.all([
    comments.countDocuments(UNREVIEWED_GUEST, { limit: cap }),
    comments.countDocuments(
      { ...UNREVIEWED_GUEST, createdAt: { $lt: new Date(now - REVIEW_SLA_MS) } },
      { limit: cap }
    ),
  ]);

  return { unreviewed, overdue };
}

/** Pure decision, exported for testing. */
export function evaluateAlert({ threshold, unreviewed, overdue }) {
  const reasons = [];

  if (threshold > 0 && unreviewed >= threshold) {
    reasons.push(`${unreviewed} guest comments are waiting for review (alert threshold: ${threshold})`);
  }

  if (overdue > 0) {
    reasons.push(`${overdue} guest comment${overdue === 1 ? ' has' : 's have'} been unreviewed for more than ${REVIEW_SLA_HOURS} hours`);
  }

  return { shouldAlert: reasons.length > 0, reasons };
}

async function resolveRecipients(settings) {
  if (settings.alertEmails?.length) {
    return settings.alertEmails;
  }

  // Nobody configured: fall back to the admins, who own moderation.
  const users = await getCollection(COLLECTIONS.USERS);
  const admins = await users
    .find({ role: 'admin', isActive: { $ne: false }, email: { $exists: true, $ne: '' } })
    .project({ email: 1 })
    .toArray();

  return [...new Set(admins.map((admin) => admin.email))];
}

function buildMessage({ reasons, unreviewed, overdue }) {
  const queueUrl = `${SITE_URL}/admin?tab=comments`;
  const subject = overdue > 0
    ? `[INI KhabarON] ${overdue} guest comment${overdue === 1 ? '' : 's'} unreviewed over ${REVIEW_SLA_HOURS}h`
    : `[INI KhabarON] ${unreviewed} guest comments awaiting review`;

  const items = reasons.map((reason) => `<li>${reason}</li>`).join('');

  return {
    subject,
    html:
      `<p>Guest comments are published immediately and need an editorial review.</p>` +
      `<ul>${items}</ul>` +
      `<p><a href="${queueUrl}">Open the comment review queue</a></p>` +
      `<p style="color:#6b7280;font-size:12px">You are receiving this because comment alerts are enabled in the admin Comments settings. ` +
      `This alert will not repeat for ${ALERT_COOLDOWN_MS / 3600000} hours.</p>`,
    text: `${reasons.join('\n')}\n\nReview queue: ${queueUrl}`,
  };
}

/**
 * One alert check. Returns what happened, mostly for tests/logging:
 *   { skipped: 'disabled' | 'throttled' | 'ok' | 'cooldown' | 'no_recipients' }
 *   { sent: true, recipients, failed }       — at least one email went out
 *   { skipped: 'send_failed' }               — every send failed; will retry
 *
 * `settings` may be passed by a caller that already loaded it (the public
 * comments GET does), saving a read. `send` is injectable for tests.
 */
export async function checkGuestCommentAlert({
  now = Date.now(),
  settings: preloaded,
  send = defaultSend,
} = {}) {
  const settings = preloaded ?? (await getCommentModerationSettings());

  if (!settings.alertEnabled) {
    return { skipped: 'disabled' };
  }

  // Cheap in-memory pre-check so most calls cost no write at all.
  if (
    settings.alertLastCheckAt &&
    now - new Date(settings.alertLastCheckAt).getTime() < ALERT_CHECK_INTERVAL_MS
  ) {
    return { skipped: 'throttled' };
  }

  const collection = await getSystemSettingsCollection();

  // Atomic claim: of all concurrent callers, exactly one proceeds.
  const checkClaim = await collection.updateOne(
    {
      _id: SETTINGS_ID,
      $or: [
        { alertLastCheckAt: { $exists: false } },
        { alertLastCheckAt: null },
        { alertLastCheckAt: { $lt: new Date(now - ALERT_CHECK_INTERVAL_MS) } },
      ],
    },
    { $set: { alertLastCheckAt: new Date(now) } }
  );

  if (checkClaim.modifiedCount !== 1) {
    return { skipped: 'throttled' };
  }

  const threshold = settings.alertThreshold;
  const counts = await countUnreviewedGuest(now, Math.max(threshold, 1000));
  const decision = evaluateAlert({ threshold, ...counts });

  if (!decision.shouldAlert) {
    // Back under control: re-arm so the next build-up alerts immediately.
    await collection.updateOne(
      { _id: SETTINGS_ID, alertLastSentAt: { $exists: true } },
      { $unset: { alertLastSentAt: '' } }
    );
    return { skipped: 'ok' };
  }

  const sentClaim = await collection.updateOne(
    {
      _id: SETTINGS_ID,
      $or: [
        { alertLastSentAt: { $exists: false } },
        { alertLastSentAt: null },
        { alertLastSentAt: { $lt: new Date(now - ALERT_COOLDOWN_MS) } },
      ],
    },
    { $set: { alertLastSentAt: new Date(now) } }
  );

  if (sentClaim.modifiedCount !== 1) {
    return { skipped: 'cooldown' };
  }

  const releaseClaim = () =>
    collection.updateOne(
      { _id: SETTINGS_ID },
      settings.alertLastSentAt
        ? { $set: { alertLastSentAt: new Date(settings.alertLastSentAt) } }
        : { $unset: { alertLastSentAt: '' } }
    );

  const recipients = await resolveRecipients(settings);

  if (!recipients.length) {
    await releaseClaim();
    return { skipped: 'no_recipients' };
  }

  const message = buildMessage({ ...decision, ...counts });

  const results = await Promise.all(
    recipients.map(async (to) => {
      try {
        const result = await send({ ...message, to });
        return result?.success !== false;
      } catch {
        return false;
      }
    })
  );

  const delivered = results.filter(Boolean).length;

  if (!delivered) {
    // Nothing went out: undo the claim so the next check retries, instead of
    // staying silent for the whole cooldown.
    await releaseClaim();
    return { skipped: 'send_failed' };
  }

  return { sent: true, recipients: recipients.length, failed: recipients.length - delivered };
}

/**
 * The only entry point request handlers should use: never throws, never takes
 * long. See the note at the top of this file.
 */
export async function runGuestCommentAlertCheck(options) {
  let timer;

  try {
    return await Promise.race([
      checkGuestCommentAlert(options),
      new Promise((resolve) => {
        timer = setTimeout(() => resolve({ skipped: 'timeout' }), ALERT_RUN_TIMEOUT_MS);
      }),
    ]);
  } catch (error) {
    logApiError('guestCommentAlert', error);
    return { skipped: 'error' };
  } finally {
    clearTimeout(timer);
  }
}
