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

/**
 * RETRY POLICY (enforced here; do not reimplement per-caller)
 *
 *   backoff        exponential, doubling — NOT linear. A linear schedule retries
 *                  a dead dependency far too often early on and gives up too
 *                  soon overall.
 *   intervals      attempt 1 fails -> +5m, 2 -> +10m, 3 -> +20m, 4 -> +40m
 *   cap            6h between attempts
 *   max attempts   5 (MAX_ATTEMPTS), spanning ~1h15m of wall clock
 *   permanent fail after attempt 5 fails, status becomes 'failed' and the worker
 *                  stops touching it. Nothing is deleted.
 *   manual retry   requeueJob() sets it back to 'pending' with attempts reset,
 *                  so an admin can revive a failed job once the cause is fixed
 *                  (see /api/admin/notifications/jobs/[id]).
 *
 * A crash mid-send is NOT a failed attempt: resetStuckJobs returns the job to
 * pending without consuming backoff, and `progress` is preserved so the retry
 * resumes rather than re-sending.
 */
export const MAX_ATTEMPTS = 5;

const BASE_RETRY_MS = 5 * 60 * 1000;
const MAX_RETRY_MS = 6 * 60 * 60 * 1000;

/** Exponential backoff: 5m, 10m, 20m, 40m … capped at 6h. */
function retryDelayMs(attempts) {
  return Math.min(BASE_RETRY_MS * 2 ** Math.max(0, attempts - 1), MAX_RETRY_MS);
}

/**
 * Lower number = processed first. The worker always drains higher priority
 * before touching lower, so a newsletter backlog can never delay a breaking
 * alert.
 */
const PRIORITY = {
  breaking: 1,
  trending: 2,
  published: 3,
  newsletter: 4,
  other: 5,
};

function priorityFor(type) {
  return PRIORITY[type] ?? PRIORITY.other;
}

export async function createJob({ type, articleId, title, body, imageUrl, deepLink, targeting, createdBy, priority }) {
  const jobs = await getNotificationJobsCollection();
  const now = new Date();

  const job = {
    id: crypto.randomUUID(),
    type,
    priority: priority ?? priorityFor(type),
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

  // priority first, then oldest-due. Jobs written before `priority` existed sort
  // as missing (ahead of 1 in Mongo's ordering), which is harmless — that
  // backlog is small and finite, and draining it early costs nothing.
  const result = await jobs.findOneAndUpdate(
    { status: 'pending', nextAttemptAt: { $not: { $gt: now } } },
    { $set: { status: 'processing', startedAt: now }, $inc: { attempts: 1 } },
    { sort: { priority: 1, nextAttemptAt: 1, createdAt: 1 }, returnDocument: 'after' }
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
 * Admin control: revive a job the worker has given up on (status 'failed'), or
 * one parked in 'processing' by a crash.
 *
 * `attempts` resets to 0 so the full backoff schedule is available again — the
 * assumption is that an admin only requeues after fixing the underlying cause.
 * `progress` is kept by default so a partially-delivered job resumes instead of
 * re-notifying everyone; pass `fromScratch` to deliberately start over.
 */
export async function requeueJob(id, { fromScratch = false } = {}) {
  const jobs = await getNotificationJobsCollection();
  const update = {
    $set: { status: 'pending', nextAttemptAt: new Date(), attempts: 0, startedAt: null, completedAt: null },
  };
  if (fromScratch) update.$unset = { progress: '' };

  const result = await jobs.findOneAndUpdate(
    { id, status: { $in: ['failed', 'processing'] } },
    update,
    { returnDocument: 'after' }
  );
  return result?.value || result || null;
}

/**
 * Admin control: cancel a job that has not been delivered yet. Terminal and
 * distinct from 'failed' — 'cancelled' means a human decided not to send, so the
 * worker ignores it and it never counts against delivery health.
 */
export async function cancelJob(id) {
  const jobs = await getNotificationJobsCollection();
  const result = await jobs.findOneAndUpdate(
    { id, status: { $in: ['pending', 'failed'] } },
    { $set: { status: 'cancelled', completedAt: new Date(), nextAttemptAt: null } },
    { returnDocument: 'after' }
  );
  return result?.value || result || null;
}

/** Full record for one job — lifecycle timestamps, attempts, failure reason. */
export async function getJob(id) {
  const jobs = await getNotificationJobsCollection();
  return jobs.findOne({ id }, { projection: { _id: 0 } });
}

/** Recent jobs for the admin list, newest first. Optionally filtered by status. */
export async function listJobs({ status, limit = 50 } = {}) {
  const jobs = await getNotificationJobsCollection();
  const filter = status ? { status } : {};
  return jobs.find(filter).sort({ createdAt: -1 }).limit(Math.min(limit, 200))
    .project({ _id: 0, body: 0, targeting: 0 }).toArray();
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
