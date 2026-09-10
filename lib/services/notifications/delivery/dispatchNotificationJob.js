import {
  claimNextPendingJob,
  markJobResult,
  scheduleJobRetry,
  saveJobProgress,
  MAX_ATTEMPTS,
} from '@/lib/services/jobs/jobService';
import { resolveTargetUserIds } from './targetingService';
import { getTokensForUserIds } from '../pushTokenService';
import { sendToTokens } from './pushSenderService';
import { processAudioGenerationJob } from '@/lib/services/audio/processAudioGenerationJob';
import { logApiError } from '@/lib/api/errors';

/**
 * The generic job worker — claim job → dispatch by kind → record outcome.
 * Cron/background workers only.
 *
 * This module's import graph reaches Firebase Admin (via pushSenderService),
 * and therefore jwks-rsa and jose. Nothing on the editorial request path may
 * import it, directly or transitively — that is the whole point of the split.
 * See the "Notification architecture" section of CLAUDE.md.
 *
 * There is deliberately no "run this job now" export. Running a job is never
 * part of an editorial request, so there is no entry point that would let it
 * quietly become one again.
 *
 * Adding a new job kind means adding one function to HANDLERS below — the
 * shared retry/backoff/stuck-recovery machinery (lib/services/jobs/jobService.js)
 * doesn't change. A handler with heavy vendor dependencies (Google Cloud TTS,
 * etc.) should live in its own module the way pushSenderService.js does for
 * Firebase, imported only here — never from editorial code.
 */

// Resolve targets → gather tokens → send → return the outcome. Retry/backoff
// on failure is the generic runJob's job, not this handler's — it just
// throws and lets the shared wrapper decide what happens next.
async function processNotificationJob(job) {
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

  return {
    status: 'sent',
    stats: {
      targetedUsers: targetUserIds.length,
      tokensAttempted: base.tokensAttempted + sendResult.tokensAttempted,
      sent: base.sent + sendResult.sent,
      failed: base.failed + sendResult.failed,
      invalidRemoved: base.invalidRemoved + sendResult.invalidRemoved,
    },
  };
}

// Registered per job kind. voice_briefing gets a real handler when that
// feature is built (Phase 3A.2 only covers per-article Audio News); until
// then a claimed voice_briefing job fails cleanly (retried, then parked as
// 'failed') rather than being silently mishandled or crashing the worker.
const HANDLERS = {
  notification: processNotificationJob,
  audio_generation: processAudioGenerationJob,
  voice_briefing: async () => {
    throw new Error('voice_briefing job handler not implemented yet');
  },
};

// Runs one already-claimed job end-to-end via its kind's handler. A failure
// is retried with backoff until MAX_ATTEMPTS, then parked as failed so a
// permanently broken job cannot spin forever — this part is intentionally
// the same for every kind, not just notifications.
async function runJob(job) {
  try {
    const handler = HANDLERS[job.kind];
    if (!handler) throw new Error(`No job handler registered for kind "${job.kind}"`);

    const { status, stats } = await handler(job);
    await markJobResult(job.id, { status, stats });
    return status;
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
        `[jobs] job ${job.id} (${job.kind}) attempt ${job.attempts}/${MAX_ATTEMPTS} failed; retrying after ${nextAttemptAt.toISOString()}`
      );
      return 'retry';
    }

    // Stats shape is kind-specific and the job never produced any, so this
    // stays a bare {} rather than assuming notification-shaped counters.
    await markJobResult(job.id, {
      status: 'failed',
      stats: job.stats || {},
      error: error.message,
    });
    return 'failed';
  }
}

/**
 * Claims and runs the next due job of any kind. Returns null when the queue
 * is drained, otherwise `{ id, outcome }` so the caller can report what
 * happened.
 */
export async function runNextPendingJob() {
  const job = await claimNextPendingJob();
  if (!job) return null;
  const outcome = await runJob(job);
  return { id: job.id, outcome };
}
