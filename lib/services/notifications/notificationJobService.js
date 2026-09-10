import * as jobService from '@/lib/services/jobs/jobService';

/**
 * Notification-specific adapter over the generic job engine
 * (lib/services/jobs/jobService.js) — see that file's header for why the
 * lifecycle logic (claim/retry/backoff/stuck-recovery) lives there now
 * instead of here. This file keeps every export notification code already
 * depends on (articleNotificationQueue.js, dispatchNotificationJob.js, the
 * two admin job routes, notificationMetricsService.js), unchanged, so none
 * of those call sites needed to change.
 *
 * Deliberately free of Firebase/FCM so the editorial layer can reach it: an
 * editorial action writes a job here and returns, and the delivery layer
 * (lib/services/notifications/delivery/, cron-only) picks it up later. See the
 * "Notification architecture" section of CLAUDE.md for why.
 */

export const MAX_ATTEMPTS = jobService.MAX_ATTEMPTS;

/**
 * Lower number = processed first. The worker always drains higher priority
 * before touching lower, so a newsletter backlog can never delay a breaking
 * alert. Kept here (not in the generic engine) because only notifications
 * have this specific ordering — another kind might not have sub-types at
 * all, or might prioritize differently.
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
  return jobService.createJob({
    kind: 'notification',
    type,
    priority: priority ?? priorityFor(type),
    articleId,
    title,
    body,
    imageUrl: imageUrl || null,
    deepLink,
    targeting,
    createdBy,
    stats: { targetedUsers: 0, tokensAttempted: 0, sent: 0, failed: 0, invalidRemoved: 0 },
  });
}

export const claimNextPendingJob = jobService.claimNextPendingJob;
export const saveJobProgress = jobService.saveJobProgress;
export const markJobResult = jobService.markJobResult;
export const scheduleJobRetry = jobService.scheduleJobRetry;
export const requeueJob = jobService.requeueJob;
export const cancelJob = jobService.cancelJob;
export const getJob = jobService.getJob;
export const resetStuckJobs = jobService.resetStuckJobs;

export function listJobs({ status, limit = 50 } = {}) {
  return jobService.listJobs({ status, kind: 'notification', limit });
}
