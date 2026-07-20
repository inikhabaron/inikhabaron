import { getDbCollection } from './index';
import { COLLECTIONS } from '@/lib/constants/collections';

export async function getPushTokensCollection() {
  return getDbCollection(COLLECTIONS.PUSH_TOKENS, [
    {
      keys: { token: 1 },
      options: { unique: true }
    },
    {
      keys: { userId: 1 }
    }
  ]);
}
