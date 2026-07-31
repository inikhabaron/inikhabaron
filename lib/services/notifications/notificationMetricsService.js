import { getNotificationJobsCollection } from '@/lib/db/notificationJobs';
import { MAX_ATTEMPTS } from './notificationJobService';

/**
 * Read-only health view of the notification queue.
 *
 * Belongs to neither layer's send path and imports no Firebase, so it is safe on
 * a request path. It exists because delivery is now asynchronous: publishing
 * keeps working when notifications break, which is the goal — but it also means
 * a silently dead delivery pipeline would otherwise go unnoticed. This is how
 * you find out.
 */
export async function getNotificationMetrics() {
  const jobs = await getNotificationJobsCollection();
  const now = Date.now();

  const [byStatus, oldestPending, lastSent, lastFailed, retrying, timing] = await Promise.all([
    jobs.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]).toArray(),

    // Oldest *due* pending job — the honest "how far behind are we" signal.
    jobs.find({ status: 'pending' }).sort({ createdAt: 1 }).limit(1)
      .project({ _id: 0, id: 1, type: 1, createdAt: 1, attempts: 1, nextAttemptAt: 1, error: 1 }).next(),

    jobs.find({ status: 'sent' }).sort({ completedAt: -1 }).limit(1)
      .project({ _id: 0, id: 1, type: 1, completedAt: 1, stats: 1 }).next(),

    jobs.find({ status: 'failed' }).sort({ completedAt: -1 }).limit(1)
      .project({ _id: 0, id: 1, type: 1, completedAt: 1, attempts: 1, error: 1 }).next(),

    // Pending WITH prior attempts = actively retrying, as opposed to never tried.
    jobs.countDocuments({ status: 'pending', attempts: { $gt: 0 } }),

    jobs.aggregate([
      { $match: { status: 'sent', startedAt: { $ne: null }, completedAt: { $ne: null } } },
      { $sort: { completedAt: -1 } },
      { $limit: 100 },
      { $project: { ms: { $subtract: ['$completedAt', '$startedAt'] }, attempts: 1 } },
      { $group: { _id: null, avgMs: { $avg: '$ms' }, maxMs: { $max: '$ms' }, avgAttempts: { $avg: '$attempts' }, n: { $sum: 1 } } },
    ]).toArray(),
  ]);

  const counts = { pending: 0, processing: 0, sent: 0, failed: 0 };
  for (const row of byStatus) if (row._id) counts[row._id] = row.count;

  const t = timing[0] || {};
  const oldestPendingAgeMs = oldestPending ? now - new Date(oldestPending.createdAt).getTime() : null;

  return {
    counts: { ...counts, retrying },
    queue: {
      oldestPending,
      oldestPendingAgeMinutes: oldestPendingAgeMs === null ? null : Math.round(oldestPendingAgeMs / 60000),
      // A pending job older than this has almost certainly outlived the backoff
      // schedule, which means the worker itself is not running.
      stalled: oldestPendingAgeMs !== null && oldestPendingAgeMs > 12 * 60 * 60 * 1000,
    },
    lastRun: { lastSuccessful: lastSent, lastFailed },
    processing: {
      avgMsLast100: t.avgMs != null ? Math.round(t.avgMs) : null,
      maxMsLast100: t.maxMs != null ? Math.round(t.maxMs) : null,
      avgAttemptsLast100: t.avgAttempts != null ? Number(t.avgAttempts.toFixed(2)) : null,
      sampleSize: t.n || 0,
    },
    config: { maxAttempts: MAX_ATTEMPTS },
  };
}
