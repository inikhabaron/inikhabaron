import crypto from 'crypto';
import { getNotificationJobsCollection } from '@/lib/db/notificationJobs';

/**
 * Generic async job persistence — the shared engine behind every job kind
 * (`kind: 'notification' | 'audio_generation' | 'voice_briefing' | ...`).
 *
 * Extracted from notificationJobService.js once the audit for Phase 3A
 * (Audio News) found this lifecycle logic — claim, retry/backoff, stuck-job
 * recovery — was already 100% generic underneath a notification-shaped API;
 * duplicating it into a second `audio_jobs` engine would have created two
 * independent reliability systems that would inevitably drift (see
 * docs/mvp3-phase1-architecture.md, Async Job Platform).
 *
 * What stays kind-specific and lives OUTSIDE this file: default priority
 * ordering (notifications' breaking > trending > published map), default
 * stats shape, and — most importantly — the actual work a job performs.
 * This module only knows how to store, claim and retry a job; it never
 * imports anything a specific kind's processing needs (Firebase, Google
 * Cloud TTS, etc.), the same "editorial never touches delivery" boundary
 * notification_jobs was already built around, now generalized.
 */

export const MAX_ATTEMPTS = 5;

const BASE_RETRY_MS = 5 * 60 * 1000;
const MAX_RETRY_MS = 6 * 60 * 60 * 1000;

/** Exponential backoff: 5m, 10m, 20m, 40m … capped at 6h. */
function retryDelayMs(attempts) {
  return Math.min(BASE_RETRY_MS * 2 ** Math.max(0, attempts - 1), MAX_RETRY_MS);
}

/**
 * Creates a job of any kind. `priority` and `stats` are the caller's
 * responsibility to default sensibly — this layer doesn't know what a
 * "notification" or "audio_generation" job's priority or stats shape
 * should be, only how to store and schedule whatever it's given.
 * Everything in `payload` is stored flat on the document (not nested),
 * matching the existing notification_jobs document shape exactly — no
 * migration needed for the 195 already-live documents.
 */
export async function createJob({ kind, priority = 5, createdBy = null, stats = {}, ...payload }) {
  const jobs = await getNotificationJobsCollection();
  const now = new Date();

  const job = {
    id: crypto.randomUUID(),
    kind,
    priority,
    ...payload,
    status: 'pending',
    createdBy,
    createdAt: now,
    // Eligible immediately; pushed forward by scheduleJobRetry on failure.
    nextAttemptAt: now,
    startedAt: null,
    completedAt: null,
    stats,
    error: null,
    attempts: 0,
  };

  await jobs.insertOne(job);
  return job;
}

/**
 * Atomically claims the next due pending job of ANY kind, so concurrent
 * cron invocations can never pick up the same one. Kind-agnostic on
 * purpose — the worker claims one job at a time and dispatches by kind
 * afterward, rather than running separate claim queries per kind, so a
 * kind with no pending work never wastes a claim attempt.
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
 * Checkpoints mid-run progress so a crashed or retried job resumes instead of
 * restarting from the beginning. `lastTokenId` is notification-specific
 * naming (kept verbatim, not genericized, to guarantee zero behavioral
 * change for the one existing caller) — it means "every unit of work up to
 * and including this one has been attempted." A different kind's handler
 * can pass whatever checkpoint value makes sense for it; this layer just
 * stores it. `stats` are cumulative for the job, shape entirely up to the
 * caller.
 */
export async function saveJobProgress(id, { lastTokenId, stats }) {
  const jobs = await getNotificationJobsCollection();
  await jobs.updateOne(
    { id },
    { $set: { progress: { lastTokenId, updatedAt: new Date() }, stats } }
  );
}

/** Terminal outcome — e.g. 'sent'/'ready'/whatever the kind's success status is named, or 'failed'. */
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
 * `progress` is kept by default so a partially-completed job resumes instead of
 * redoing everything; pass `fromScratch` to deliberately start over.
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
 * Admin control: cancel a job that has not completed yet. Terminal and
 * distinct from 'failed' — 'cancelled' means a human decided not to run it,
 * so the worker ignores it and it never counts against health.
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

/** Recent jobs for an admin list, newest first. Optionally filtered by status and/or kind. */
export async function listJobs({ status, kind, limit = 50 } = {}) {
  const jobs = await getNotificationJobsCollection();
  const filter = {};
  if (status) filter.status = status;
  if (kind) filter.kind = kind;
  return jobs.find(filter).sort({ createdAt: -1 }).limit(Math.min(limit, 200))
    .project({ _id: 0, body: 0, targeting: 0 }).toArray();
}

/**
 * Crash recovery: a job stuck in "processing" (the process died mid-run) goes
 * back to pending. nextAttemptAt is cleared rather than pushed out, because a
 * crash is not evidence the job itself is failing — it should be eligible on
 * the next sweep. `progress` is deliberately left intact so the retry resumes
 * from the last checkpoint rather than redoing everything.
 *
 * IMPORTANT: this threshold must stay comfortably GREATER than the delivery
 * route's `maxDuration`. If it were shorter, a worker still legitimately
 * running could have its job reset and re-claimed by a concurrent sweep, which
 * is exactly the duplicate-run race the atomic claim exists to prevent.
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

/**
 * Per-kind queue health — {kind, pendingCount, processingCount, sentCount,
 * failedCount, cancelledCount, oldestPendingAt, oldestPendingAgeMinutes,
 * stalled}. Exists because the notification backlog (139 jobs, oldest a
 * month old) went unnoticed for as long as it did: the equivalent
 * notification-only metrics already existed but were never surfaced in any
 * admin UI. This is the platform-wide version, meant to actually be looked
 * at (see GET /api/admin/jobs/status and the admin dashboard).
 */
export async function getQueueHealth() {
  const jobs = await getNotificationJobsCollection();
  const now = Date.now();

  const rows = await jobs.aggregate([
    {
      $group: {
        _id: { kind: '$kind', status: '$status' },
        count: { $sum: 1 },
        oldestCreatedAt: { $min: '$createdAt' },
      },
    },
  ]).toArray();

  const byKind = new Map();
  const entryFor = (kind) => {
    if (!byKind.has(kind)) {
      byKind.set(kind, {
        kind, pendingCount: 0, processingCount: 0, sentCount: 0,
        failedCount: 0, cancelledCount: 0, oldestPendingAt: null,
      });
    }
    return byKind.get(kind);
  };

  for (const row of rows) {
    // Docs written before `kind` existed are all notification jobs — the
    // only kind that existed at the time.
    const kind = row._id.kind || 'notification';
    const entry = entryFor(kind);
    switch (row._id.status) {
      case 'pending':
        entry.pendingCount = row.count;
        entry.oldestPendingAt = row.oldestCreatedAt;
        break;
      case 'processing': entry.processingCount = row.count; break;
      case 'sent': entry.sentCount = row.count; break;
      case 'failed': entry.failedCount = row.count; break;
      case 'cancelled': entry.cancelledCount = row.count; break;
      default: break;
    }
  }

  return Array.from(byKind.values()).map((entry) => {
    const ageMs = entry.oldestPendingAt ? now - new Date(entry.oldestPendingAt).getTime() : null;
    return {
      ...entry,
      oldestPendingAgeMinutes: ageMs === null ? null : Math.round(ageMs / 60000),
      // Same threshold notificationMetricsService already used: a pending
      // job older than this has almost certainly outlived the retry
      // schedule, which means the worker itself isn't running.
      stalled: ageMs !== null && ageMs > 12 * 60 * 60 * 1000,
    };
  });
}
