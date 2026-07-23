import { getDbCollection } from './index';
import { COLLECTIONS } from '@/lib/constants/collections';

export async function getReelsCollection() {
  return getDbCollection(COLLECTIONS.SHORT_VIDEOS, [
    { keys: { id: 1 }, options: { unique: true } },
    { keys: { status: 1, isDeleted: 1, publishedAt: -1 } },
    { keys: { category: 1, isDeleted: 1, publishedAt: -1 } },
    { keys: { reporterId: 1, publishedAt: -1 } },
    { keys: { status: 1, scheduledAt: 1 } },
    { keys: { linkedArticleId: 1 } },
    // Serves listReelsAdmin's default (no-search) sort — {isDeleted,status}
    // as an equality prefix, createdAt as the trailing sort key, so the
    // admin list (with or without a status filter) doesn't fall back to an
    // in-memory sort the way it did before this index existed.
    { keys: { isDeleted: 1, status: 1, createdAt: -1 } },
    {
      keys: { title: 'text', description: 'text', tags: 'text' },
      // MongoDB text indexes treat a top-level field literally named
      // `language` as the stemming-language override for EVERY document in
      // the collection by default (language_override defaults to
      // "language") — since reel documents already have their own
      // `language` field ('en'/'hi'), inserting/updating a Hindi reel would
      // fail outright ("language override unsupported: hi") the moment this
      // index exists. Pointing language_override at an unused field name
      // avoids the collision entirely.
      options: {
        name: 'reels_text_search',
        weights: { title: 5, tags: 3, description: 1 },
        language_override: 'textSearchLanguage',
      },
    },
  ]);
}
