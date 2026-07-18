import { COLLECTIONS } from '@/lib/constants/collections';
import { getDbCollection } from './index';

// The email unique index already exists in the DB under Mongo's default name
// (email_1) from before this module existed — declaring it here without a
// custom `name` keeps createIndex idempotent instead of colliding with it
// (see lib/db/comments.js for the same IndexOptionsConflict gotcha).
const newsletterIndexes = [
  { keys: { email: 1 }, options: { unique: true } },
  { keys: { status: 1 }, options: { name: 'status' } },
  { keys: { language: 1 }, options: { name: 'language' } },
  { keys: { userId: 1 }, options: { name: 'user_id', sparse: true } },
];

export function getNewsletterCollection() {
  return getDbCollection(
    COLLECTIONS.NEWSLETTER,
    newsletterIndexes
  );
}
