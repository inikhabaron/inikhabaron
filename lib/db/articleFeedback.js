import { getDbCollection } from './index';
import { COLLECTIONS } from '@/lib/constants/collections';

// Pattern 1 (dedicated collection, unique compound index) — same shape as
// lib/db/bookmarks.js and lib/db/likes.js. One feedback entry per user per
// article; a second submission updates it rather than creating a duplicate.
export function getArticleFeedbackCollection() {
  return getDbCollection(COLLECTIONS.ARTICLE_FEEDBACK, [
    { keys: { userId: 1, articleId: 1 }, options: { unique: true } },
    // Admin aggregate view: avg rating / all feedback for one article.
    { keys: { articleId: 1 } },
  ]);
}
