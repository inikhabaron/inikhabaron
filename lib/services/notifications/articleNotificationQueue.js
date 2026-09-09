import { createJob } from './notificationJobService';
import { logApiError } from '@/lib/api/errors';

/**
 * Layer 1 — editorial. The only notification code an editorial route may touch.
 *
 * Queues a notification job and returns. It does not send anything, and it must
 * never import anything that can: no Firebase Admin, no FCM, no jwks-rsa/jose,
 * no push sender, no dispatcher. Its whole dependency graph is
 * notificationJobService → MongoDB.
 *
 * That constraint is the point, not an implementation detail. Publishing an
 * article is an editorial operation; delivering a push is infrastructure. When
 * they shared a module graph, a broken push dependency could stop an editor
 * from publishing at all. See the "Notification architecture" section of
 * CLAUDE.md for the incident that motivated the split.
 *
 * The delivery layer (lib/services/notifications/delivery/, cron-only) drains
 * the queue afterwards and owns retries.
 */

function deepLinkFor(article) {
  return `/news/${article.id}`;
}

// Persisting the job is best-effort *for the caller*: by the time this runs the
// article is already published, so failing to enqueue must not turn a
// successful editorial action into an error. The job is lost rather than the
// publish, and the reason is logged.
async function enqueue(jobInput) {
  try {
    return await createJob(jobInput);
  } catch (error) {
    logApiError('articleNotificationQueue.enqueue', error);
    return null;
  }
}

export async function queueBreakingNotification(article, adminId) {
  return enqueue({
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

export async function queueTrendingNotification(article, adminId) {
  return enqueue({
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

export async function queuePublishedNotification(article, adminId) {
  return enqueue({
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

// Live Blogs reuse the existing 'published' type rather than a new
// taxonomy value (locked 2026-09-09, see docs/mvp3-phase1-architecture.md
// round 5) — a live blog going live is still "new published content" as
// far as a notification recipient is concerned. `articleId` is left null
// unless the blog is linked to a real article: it's genuinely not one,
// and overloading that field would misdescribe it to anything reading the
// job later.
export async function queueLiveBlogPublishedNotification(blog, adminId) {
  return enqueue({
    type: 'published',
    articleId: blog.linkedArticleId || null,
    title: 'Live Now',
    body: blog.title,
    imageUrl: blog.featuredImage || null,
    deepLink: `/live-blogs/${blog.slug}`,
    targeting: { mode: 'all' },
    createdBy: adminId,
  });
}

// Only a 'breaking'-type blog's updates notify — "explicit breaking-news
// updates" per the locked decision. A 'general'/'sports'/'election' blog's
// updates never do; only the blog-goes-live moment above notifies for
// those. Still `type: 'published'`, same reasoning as above.
export async function queueLiveBlogUpdateNotification(blog, update, adminId) {
  return enqueue({
    type: 'published',
    articleId: blog.linkedArticleId || null,
    title: 'Breaking Update',
    body: blog.title,
    imageUrl: blog.featuredImage || null,
    deepLink: `/live-blogs/${blog.slug}`,
    targeting: { mode: 'all' },
    createdBy: adminId,
  });
}
