import { getDbCollection } from './index';
import { COLLECTIONS } from '@/lib/constants/collections';

export async function getReelBookmarksCollection() {
  return getDbCollection(COLLECTIONS.REEL_BOOKMARKS, [
    {
      keys: { userId: 1, reelId: 1 },
      options: { unique: true },
    },
    {
      keys: { userId: 1 },
    },
    {
      keys: { reelId: 1 },
    },
  ]);
}
