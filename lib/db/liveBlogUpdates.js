import { getDbCollection } from './index';
import { COLLECTIONS } from '@/lib/constants/collections';

// Append-only feed keyed by parent live blog, same shape as comments'
// relationship to articleId — see lib/db/comments.js.
export function getLiveBlogUpdatesCollection() {
  return getDbCollection(COLLECTIONS.LIVE_BLOG_UPDATES, [
    { keys: { id: 1 }, options: { unique: true } },
    // The public feed always queries {blogId, status:'published'} sorted
    // newest-first — same three-field compound shape as comments'
    // {articleId:1, status:1, createdAt:-1} (lib/db/comments.js).
    { keys: { blogId: 1, status: 1, publishedAt: -1 } },
  ]);
}
