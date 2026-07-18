/**
 * One-time index creation. Takes a `db` handle (so it does not import mongodb.js
 * and create a require cycle). createIndex is idempotent, so running it again is
 * cheap/safe. Called fire-and-forget from getDatabase() once per process.
 */
export async function ensureIndexes(db) {
  const jobs = [
    // news
    db.collection('news').createIndex({ id: 1 }, { unique: true }),
    db.collection('news').createIndex({ status: 1, publishedAt: -1 }),
    db.collection('news').createIndex({ category: 1, publishedAt: -1 }),
    db.collection('news').createIndex({ authorId: 1, publishedAt: -1 }),
    db.collection('news').createIndex({ slug: 1 }),
    db.collection('news').createIndex({ status: 1, scheduledAt: 1 }),
    // users
    db.collection('users').createIndex({ id: 1 }, { unique: true }),
    db.collection('users').createIndex({ email: 1 }, { unique: true, sparse: true }),
    db.collection('users').createIndex({ firebaseUid: 1 }, { unique: true, sparse: true }),
    // comments
    db.collection('comments').createIndex({ articleId: 1, status: 1, createdAt: -1 }),
    db.collection('comments').createIndex({ parentCommentId: 1 }),
    // subscriptions
    db.collection('subscriptions').createIndex({ userId: 1, status: 1 }),
  ];

  const results = await Promise.allSettled(jobs);
  const failed = results.filter((r) => r.status === 'rejected');
  if (failed.length) {
    // Don't throw — an existing duplicate could block a unique index; log only.
    console.error(`[ensureIndexes] ${failed.length} index(es) failed:`, failed.map((f) => f.reason?.message));
  }
}
