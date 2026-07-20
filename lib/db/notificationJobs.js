import { getDbCollection } from './index';
import { COLLECTIONS } from '@/lib/constants/collections';

export async function getNotificationJobsCollection() {
  return getDbCollection(COLLECTIONS.NOTIFICATION_JOBS, [
    {
      keys: { id: 1 },
      options: { unique: true }
    },
    {
      keys: { status: 1, createdAt: 1 }
    }
  ]);
}
