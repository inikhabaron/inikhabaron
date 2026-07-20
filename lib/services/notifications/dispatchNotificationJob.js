import { claimNextPendingJob, claimJobById, markJobResult } from './notificationJobService';
import { resolveTargetUserIds } from './targetingService';
import { getTokensForUserIds } from './pushTokenService';
import { sendToTokens } from './pushSenderService';
import { logApiError } from '@/lib/api/errors';

// Runs one already-claimed job end-to-end: resolve targets → gather tokens
// → send → record result. Shared by the inline dispatch (from an
// approve-breaking/trending action) and the cron sweep, so behavior never
// drifts between the two paths.
async function runJob(job) {
  try {
    const targetUserIds = await resolveTargetUserIds(job.targeting);
    const tokenDocs = await getTokensForUserIds(targetUserIds);

    const sendResult = tokenDocs.length
      ? await sendToTokens(tokenDocs, {
          title: job.title,
          body: job.body,
          imageUrl: job.imageUrl,
          deepLink: job.deepLink,
        })
      : { tokensAttempted: 0, sent: 0, failed: 0, invalidRemoved: 0 };

    await markJobResult(job.id, {
      status: 'sent',
      stats: { targetedUsers: targetUserIds.length, ...sendResult },
    });
  } catch (error) {
    logApiError('dispatchNotificationJob.runJob', error);
    await markJobResult(job.id, {
      status: 'failed',
      stats: { targetedUsers: 0, tokensAttempted: 0, sent: 0, failed: 0, invalidRemoved: 0 },
      error: error.message,
    });
  }
}

// Called right after createJob() so a breaking/trending alert goes out
// immediately instead of waiting for the once-daily cron sweep.
export async function dispatchJobNow(jobId) {
  const job = await claimJobById(jobId);
  if (!job) return false;
  await runJob(job);
  return true;
}

// Used by the cron sweep to drain any jobs that failed to dispatch inline
// (e.g. the request that created them crashed before calling dispatchJobNow).
export async function runNextPendingJob() {
  const job = await claimNextPendingJob();
  if (!job) return null;
  await runJob(job);
  return job.id;
}
