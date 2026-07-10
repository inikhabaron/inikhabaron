import { COLLECTIONS } from '@/lib/constants/collections';
import { getDbCollection } from '@/lib/db';

export async function getSystemSettingsCollection() {
  return getDbCollection(
    COLLECTIONS.SYSTEM_SETTINGS
  );
}