// Append-only log of media deletions.
//
// Cloudinary destroys cannot be undone, so if an asset turns out to have been
// needed, this log is the only record of what was removed, by whom, and on
// what basis. It is written for failed attempts too — a failure still means
// someone tried, and a partially-failed bulk delete is exactly the situation
// where the record matters.
import { getCollection } from '@/lib/mongodb';
import { COLLECTIONS } from '@/lib/constants/collections';

export async function recordDeletion(entry) {
  try {
    const log = await getCollection(COLLECTIONS.MEDIA_AUDIT_LOG);
    await log.insertOne({
      ...entry,
      at: new Date(),
    });
  } catch (error) {
    // Logging must not abort a deletion loop that is already underway; the
    // route surfaces per-asset outcomes to the admin regardless.
    console.error('[mediaAudit] failed to record deletion:', error.message);
  }
}

export async function listDeletions({ limit = 100 } = {}) {
  const log = await getCollection(COLLECTIONS.MEDIA_AUDIT_LOG);
  return log.find({}, { projection: { _id: 0 } }).sort({ at: -1 }).limit(limit).toArray();
}
