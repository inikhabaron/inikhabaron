import { getDbCollection } from './index';
import { COLLECTIONS } from '@/lib/constants/collections';

// Top-level content type, sibling to news/categories — not a per-user
// interaction collection, so no userId-keyed index here.
export function getLiveBlogsCollection() {
  return getDbCollection(COLLECTIONS.LIVE_BLOGS, [
    { keys: { id: 1 }, options: { unique: true } },
    { keys: { slug: 1 }, options: { unique: true } },
    // List view: newest-active-first.
    { keys: { status: 1, updatedAt: -1 } },
    { keys: { type: 1, status: 1 } },
  ]);
}
