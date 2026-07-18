import { getDatabase } from '../lib/mongodb.js';
import { ensureIndexes } from '../lib/db/ensureIndexes.js';

// Explicit trigger for lib/db/ensureIndexes.js, which otherwise only runs
// fire-and-forget on the first request a running process serves. Useful as a
// deploy-time step so indexes exist before traffic arrives.
//
// Scope note: this only covers the collections hardcoded in
// lib/db/ensureIndexes.js (news, users, comments, subscriptions). Newer
// per-feature collections (bookmarks, likes, newsletter, user_interests, ...)
// index themselves lazily via getDbCollection() on first access — that's the
// intentional pattern (see lib/db/index.js) and isn't duplicated here.
async function run() {
  try {
    const db = await getDatabase();
    await ensureIndexes(db);
    console.log('✅ Indexes ensured.');
    process.exit(0);
  } catch (error) {
    console.error('❌ ensureIndexes failed.');
    console.error(error);
    process.exit(1);
  }
}

run();
