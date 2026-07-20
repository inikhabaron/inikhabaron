import { createJob } from './notificationJobService';
import { dispatchJobNow } from './dispatchNotificationJob';
import { logApiError } from '@/lib/api/errors';

function deepLinkFor(article) {
  return `/news/${article.id}`;
}

async function createAndDispatch(jobInput) {
  try {
    const job = await createJob(jobInput);
    await dispatchJobNow(job.id);
  } catch (error) {
    // A notification failure must never break the editorial action that
    // triggered it — publishing/approving already succeeded by the time
    // this runs; the push itself is best-effort (the cron sweep retries
    // anything left pending).
    logApiError('articleNotifications.createAndDispatch', error);
  }
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
