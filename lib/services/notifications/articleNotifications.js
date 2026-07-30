import { createJob } from './notificationJobService';
import { dispatchJobNow } from './dispatchNotificationJob';
import { logApiError } from '@/lib/api/errors';

function deepLinkFor(article) {
  return `/news/${article.id}`;
}

// Delivery is unbounded work — a full user scan plus FCM multicast batches —
// and it runs inside the admin's HTTP request. Left unbounded it can outlive
// the serverless function's execution budget, and the platform then kills the
// invocation and returns a bodyless 500, so the admin sees "failed" even
// though the approval was already written to Mongo. Waiting only up to this
// budget keeps the response inside the function's lifetime; whatever hasn't
// finished stays claimed as `processing` and is recovered by the cron sweep
// (resetStuckJobs → runNextPendingJob).
//
// Kept comfortably under Vercel's 10s default function timeout — a budget
// longer than the platform's own limit would never be reached, which is the
// failure it exists to prevent. Raise both together (add `export const
// maxDuration` to the notifying routes) if delivery ever needs longer inline.
const DISPATCH_BUDGET_MS = 8_000;

function withBudget(promise, ms) {
  let timer;
  const budget = new Promise((resolve) => { timer = setTimeout(resolve, ms); });
  return Promise.race([promise, budget]).finally(() => clearTimeout(timer));
}

async function createAndDispatch(jobInput) {
  let job;
  try {
    job = await createJob(jobInput);
  } catch (error) {
    // A notification failure must never break the editorial action that
    // triggered it — publishing/approving already succeeded by the time
    // this runs; the push itself is best-effort.
    logApiError('articleNotifications.createJob', error);
    return;
  }

  // Attach the catch before racing so abandoning the promise at the budget
  // can't surface as an unhandled rejection later.
  const dispatch = dispatchJobNow(job.id).catch((error) => {
    logApiError('articleNotifications.dispatchJobNow', error);
  });

  await withBudget(dispatch, DISPATCH_BUDGET_MS);
}

export async function notifyBreakingNews(article, adminId) {
  await createAndDispatch({
    type: 'breaking',
    articleId: article.id,
    title: '🚨 Breaking',
    body: article.title,
    imageUrl: article.featuredImage || null,
    deepLink: deepLinkFor(article),
    targeting: article.location?.enabled
      ? { mode: 'location', location: article.location }
      : { mode: 'all' },
    createdBy: adminId,
  });
}

export async function notifyTrendingNews(article, adminId) {
  await createAndDispatch({
    type: 'trending',
    articleId: article.id,
    title: '🔥 Trending',
    body: article.title,
    imageUrl: article.featuredImage || null,
    deepLink: deepLinkFor(article),
    targeting: { mode: 'category', category: article.category },
    createdBy: adminId,
  });
}

export async function notifyPublished(article, adminId) {
  await createAndDispatch({
    type: 'published',
    articleId: article.id,
    title: 'New Article',
    body: article.title,
    imageUrl: article.featuredImage || null,
    deepLink: deepLinkFor(article),
    targeting: {
      mode: 'category_or_location',
      category: article.category,
      location: article.location,
    },
    createdBy: adminId,
  });
}
