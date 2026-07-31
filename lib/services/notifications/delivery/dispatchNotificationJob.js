import {
  claimNextPendingJob,
  markJobResult,
  scheduleJobRetry,
  saveJobProgress,
  MAX_ATTEMPTS,
} from '../notificationJobService';
import { resolveTargetUserIds } from './targetingService';
import { getTokensForUserIds } from '../pushTokenService';
import { sendToTokens } from './pushSenderService';
import { logApiError } from '@/lib/api/errors';

/**
 * Layer 2 — delivery. Cron/background workers only.
 *
 * This module's import graph reaches Firebase Admin (via pushSenderService),
 * and therefore jwks-rsa and jose. Nothing on the editorial request path may
 * import it, directly or transitively — that is the whole point of the split.
 * See the "Notification architecture" section of CLAUDE.md.
 *
 * There is deliberately no "dispatch this job now" export. Sending is never
 * part of an editorial request, so there is no entry point that would let it
 * quietly become one again.
 */

const EMPTY_STATS = { targetedUsers: 0, tokensAttempted: 0, sent: 0, failed: 0, invalidRemoved: 0 };

// Runs one already-claimed job end-to-end: resolve targets → gather tokens →
// send → record outcome. A failure is retried with backoff until MAX_ATTEMPTS,
// then parked as failed so a permanently broken job cannot spin forever.
async function runJob(job) {
  try {
    const targetUserIds = await resolveTargetUserIds(job.targeting);

    // Resume rather than restart. On a first attempt there is no cursor and
    // this fetches everything; on a retry it fetches only tokens the previous
    // attempt had not reached, so recipients already delivered to are not
    // messaged again.
    const resumeAfter = job.progress?.lastTokenId || null;
    const tokenDocs = await getTokensForUserIds(targetUserIds, { afterId: resumeAfter });

    // Cumulative across attempts, so a resumed job reports totals for the whole
    // job rather than just this pass.
    const carried = resumeAfter ? job.stats || {} : {};
    const base = {
      sent: carried.sent || 0,
      failed: carried.failed || 0,
      invalidRemoved: carried.invalidRemoved || 0,
      tokensAttempted: carried.tokensAttempted || 0,
    };

    const sendResult = tokenDocs.length
      ? await sendToTokens(
          tokenDocs,
          { title: job.title, body: job.body, imageUrl: job.imageUrl, deepLink: job.deepLink },
          {
            onProgress: ({ lastTokenId, totals }) =>
              saveJobProgress(job.id, {
                lastTokenId,
                stats: {
                  targetedUsers: targetUserIds.length,
                  tokensAttempted: base.tokensAttempted + totals.tokensAttempted,
                  sent: base.sent + totals.sent,
                  failed: base.failed + totals.failed,
                  invalidRemoved: base.invalidRemoved + totals.invalidRemoved,
                },
              }),
          }
        )
      : { tokensAttempted: 0, sent: 0, failed: 0, invalidRemoved: 0 };

    await markJobResult(job.id, {
      status: 'sent',
      stats: {
        targetedUsers: targetUserIds.length,
        tokensAttempted: base.tokensAttempted + sendResult.tokensAttempted,
        sent: base.sent + sendResult.sent,
        failed: base.failed + sendResult.failed,
        invalidRemoved: base.invalidRemoved + sendResult.invalidRemoved,
      },
    });
    return 'sent';
  } catch (error) {
    logApiError('delivery.dispatchNotificationJob.runJob', error);

    // job.attempts is post-increment (claimNextPendingJob bumped it), so it is
    // the number of attempts already spent on this job.
    if (job.attempts < MAX_ATTEMPTS) {
      const nextAttemptAt = await scheduleJobRetry(job.id, {
        attempts: job.attempts,
        error: error.message,
      });
      console.warn(
        `[notifications] job ${job.id} attempt ${job.attempts}/${MAX_ATTEMPTS} failed; retrying after ${nextAttemptAt.toISOString()}`
      );
      return 'retry';
    }

    await markJobResult(job.id, {
      status: 'failed',
      stats: EMPTY_STATS,
      error: error.message,
    });
    return 'failed';
  }
}

/**
 * Claims and runs the next due job. Returns null when the queue is drained,
 * otherwise `{ id, outcome }` so the caller can report what happened.
 */
export async function runNextPendingJob() {
  const job = await claimNextPendingJob();
  if (!job) return null;
  const outcome = await runJob(job);
  return { id: job.id, outcome };
}
