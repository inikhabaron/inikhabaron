import { COLLECTIONS } from '@/lib/constants/collections';
import { getDbCollection } from './index';

export async function getReadingProgressCollection() {
  return getDbCollection(
    COLLECTIONS.READING_PROGRESS,
    [
      {
        keys: {
          userId: 1,
          articleId: 1,
        },
        options: {
          unique: true,
        },
      },
      {
        keys: {
          userId: 1,
          updatedAt: -1,
        },
      },
    ]
  );
}