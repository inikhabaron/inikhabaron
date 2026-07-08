import { getDbCollection } from './index';
import { COLLECTIONS } from '@/lib/constants/collections';

export async function getBookmarksCollection() {
  return getDbCollection(COLLECTIONS.BOOKMARKS, [
    {
      keys: { userId: 1, articleId: 1 },
      options: { unique: true }
    },
    {
      keys: { userId: 1 }
    },
    {
      keys: { articleId: 1 }
    }
  ]);
}