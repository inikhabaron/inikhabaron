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
    // The admin list sorts by createdAt (app/api/admin/news/route.js). Without
    // an index that is a blocking in-memory sort over every matching article —
    // already ~21 MB at 844 articles, against MongoDB's 32 MB sort limit, past
    // which the query fails outright rather than merely running slowly.
    db.collection('news').createIndex({ createdAt: -1 }),
    db.collection('news').createIndex({ status: 1, createdAt: -1 }),
    // Relevance-ranked full-text search (app/api/news/route.js) — replaces
    // an unindexed $regex $or scan across every published article.
    db.collection('news').createIndex(
      { title: 'text', tags: 'text', content: 'text' },
      { name: 'news_text_search', weights: { title: 5, tags: 3, content: 1 } }
    ),
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
