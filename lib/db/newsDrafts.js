import { getDbCollection } from '@/lib/db';
import { COLLECTIONS } from '@/lib/constants/collections';

export function getNewsDraftsCollection() {
  return getDbCollection(COLLECTIONS.NEWS_DRAFTS, [
    // Primary key for individual drafts (supports multiple new-article drafts per user)
    { keys: { draftId: 1 }, options: { unique: true } },
    // One draft per user per existing article — partial filter excludes new-article
    // drafts (newsId: null) which are identified by draftId instead.
    {
      keys: { userId: 1, newsId: 1 },
      // $ne/$not aren't supported in partialFilterExpression — MongoDB only
      // allows $eq, $exists, $gt/$gte/$lt/$lte, $type, and top-level $and.
      // newsId is always a uuid string for existing-article drafts, so
      // $type pins down "non-null" without relying on $ne.
      options: { unique: true, partialFilterExpression: { newsId: { $type: 'string' } } },
    },
    // Lookup: all drafts for a user (for listing new-article drafts)
    { keys: { userId: 1, autoSavedAt: -1 } },
    // Auto-expire abandoned drafts after 7 days of inactivity
    { keys: { autoSavedAt: 1 }, options: { expireAfterSeconds: 7 * 24 * 60 * 60 } },
  ]);
}
