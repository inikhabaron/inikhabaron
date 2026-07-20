import crypto from 'crypto';
import { getNotificationJobsCollection } from '@/lib/db/notificationJobs';

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
    startedAt: null,
    completedAt: null,
    stats: { targetedUsers: 0, tokensAttempted: 0, sent: 0, failed: 0, invalidRemoved: 0 },
    error: null,
    attempts: 0,
  };

  await jobs.insertOne(job);
  return job;
}

// Atomically claims the oldest pending job so the inline dispatch (from an
// admin action) and the cron sweep can never both pick up the same job.
export async function claimNextPendingJob() {
  const jobs = await getNotificationJobsCollection();

  const result = await jobs.findOneAndUpdate(
    { status: 'pending' },
    { $set: { status: 'processing', startedAt: new Date() }, $inc: { attempts: 1 } },
    { sort: { createdAt: 1 }, returnDocument: 'after' }
  );

  return result?.value || result || null;
}

// Claims one specific job by id (rather than "whatever is oldest") so the
// inline dispatch right after createJob() runs *that* job now, even if an
// older pending job is still ahead of it in the queue.
export async function claimJobById(id) {
  const jobs = await getNotificationJobsCollection();

  const result = await jobs.findOneAndUpdate(
    { id, status: 'pending' },
    { $set: { status: 'processing', startedAt: new Date() }, $inc: { attempts: 1 } },
    { returnDocument: 'after' }
  );

  return result?.value || result || null;
}

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

// Crash recovery: a job stuck in "processing" (the process died mid-send)
// gets reset to "pending" so the next cron sweep retries it.
export async function resetStuckJobs(olderThanMs = 10 * 60 * 1000) {
  const jobs = await getNotificationJobsCollection();
  const cutoff = new Date(Date.now() - olderThanMs);

  const result = await jobs.updateMany(
    { status: 'processing', startedAt: { $lt: cutoff } },
    { $set: { status: 'pending' } }
  );

  return result.modifiedCount;
}
