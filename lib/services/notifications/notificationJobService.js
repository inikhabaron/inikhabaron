import crypto from 'crypto';
import { getNotificationJobsCollection } from '@/lib/db/notificationJobs';

/**
 * Notification job persistence — the seam between the two notification layers.
 *
 * Deliberately free of Firebase/FCM so the editorial layer can reach it: an
 * editorial action writes a job here and returns, and the delivery layer
 * (lib/services/notifications/delivery/, cron-only) picks it up later. See the
 * "Notification architecture" section of CLAUDE.md for why.
 */

// A job gets this many total attempts before it is parked as permanently
// failed. Five attempts across the backoff schedule below spans ~7h, which
// comfortably outlasts a transient outage without retrying forever.
export const MAX_ATTEMPTS = 5;

const BASE_RETRY_MS = 5 * 60 * 1000;
const MAX_RETRY_MS = 6 * 60 * 60 * 1000;

/** Exponential backoff: 5m, 10m, 20m, 40m … capped at 6h. */
export function retryDelayMs(attempts) {
  return Math.min(BASE_RETRY_MS * 2 ** Math.max(0, attempts - 1), MAX_RETRY_MS);
}

export async function createJob({ type, articleId, title, body, imageUrl, deepLink, targeting, createdBy }) {
  const jobs = await getNotificationJobsCollection();
  const now = new Date();

  const job = {
    id: crypto.randomUUID(),
    type,
    articleId,
    title,
    body,
    imageUrl: imageUrl || null,
    deepLink,
    targeting,
    status: 'pending',
    createdBy: createdBy || null,
    createdAt: now,
    // Eligible immediately; pushed forward by scheduleJobRetry on failure.
    nextAttemptAt: now,
    startedAt: null,
    completedAt: null,
    stats: { targetedUsers: 0, tokensAttempted: 0, sent: 0, failed: 0, invalidRemoved: 0 },
    error: null,
    attempts: 0,
  };

  await jobs.insertOne(job);
  return job;
}

/**
 * Atomically claims the next due pending job, so concurrent cron invocations
 * can never pick up the same one.
 *
 * `$not: { $gt: now }` rather than `$lte: now` on purpose — it also matches
 * jobs written before nextAttemptAt existed, where the field is missing or
 * null. A plain $lte would silently skip that backlog forever.
 */
export async function claimNextPendingJob() {
  const jobs = await getNotificationJobsCollection();
  const now = new Date();

  const result = await jobs.findOneAndUpdate(
    { status: 'pending', nextAttemptAt: { $not: { $gt: now } } },
    { $set: { status: 'processing', startedAt: now }, $inc: { attempts: 1 } },
    { sort: { nextAttemptAt: 1, createdAt: 1 }, returnDocument: 'after' }
  );

  return result?.value || result || null;
}

/**
 * Checkpoints mid-send progress so a crashed or retried job resumes instead of
 * re-sending from the beginning. `lastTokenId` means "every token up to and
 * including this one has been attempted"; `stats` are cumulative for the job.
 */
export async function saveJobProgress(id, { lastTokenId, stats }) {
  const jobs = await getNotificationJobsCollection();
  await jobs.updateOne(
    { id },
    { $set: { progress: { lastTokenId, updatedAt: new Date() }, stats } }
  );
}

/** Terminal outcome — 'sent' or 'failed'. */
export async function markJobResult(id, { status, stats, error }) {
  const jobs = await getNotificationJobsCollection();

  await jobs.updateOne(
    { id },
    {
      $set: {
        status,
        stats,
        error: error || null,
        completedAt: new Date(),
      },
    }
  );
}

/** Non-terminal outcome: back to pending, deferred by the backoff schedule. */
export async function scheduleJobRetry(id, { attempts, error }) {
  const jobs = await getNotificationJobsCollection();
  const nextAttemptAt = new Date(Date.now() + retryDelayMs(attempts));

  await jobs.updateOne(
    { id },
    {
      $set: {
        status: 'pending',
        nextAttemptAt,
        error: error || null,
        startedAt: null,
      },
    }
  );

  return nextAttemptAt;
}

/**
 * Crash recovery: a job stuck in "processing" (the process died mid-send) goes
 * back to pending. nextAttemptAt is cleared rather than pushed out, because a
 * crash is not evidence the job itself is failing — it should be eligible on
 * the next sweep. `progress` is deliberately left intact so the retry resumes
 * from the last checkpoint rather than re-sending from the top.
 *
 * IMPORTANT: this threshold must stay comfortably GREATER than the delivery
 * route's `maxDuration` (60s). If it were shorter, a worker still legitimately
 * sending could have its job reset and re-claimed by a concurrent sweep, which
 * is exactly the duplicate-send race the atomic claim exists to prevent.
 */
export async function resetStuckJobs(olderThanMs = 10 * 60 * 1000) {
  const jobs = await getNotificationJobsCollection();
  const cutoff = new Date(Date.now() - olderThanMs);

  const result = await jobs.updateMany(
    { status: 'processing', startedAt: { $lt: cutoff } },
    { $set: { status: 'pending', nextAttemptAt: null } }
  );

  return result.modifiedCount;
}
