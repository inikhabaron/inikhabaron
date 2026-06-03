// Create indexes on a provided `db` instance (no imports here to avoid circulars)
export async function createIndexesFromDb(db) {
  try {
    const logger = (await import('@/lib/logger')).default;
    logger.info('Creating database indexes...');

    const safeCreateIndex = async (collectionName, spec, options, label) => {
      try {
        await db.collection(collectionName).createIndex(spec, options);
        console.log(`✓ ${collectionName}: ${label}`);
      } catch (error) {
        const message = error?.message || String(error);
        const isDuplicateKey = /duplicate key error|E11000/i.test(message);
        const isIndexConflict = /IndexOptionsConflict|already exists/i.test(message);

        if (options?.unique && isDuplicateKey) {
          logger.warn(`Duplicate values prevent unique index on ${collectionName} ${label}; creating non-unique fallback.`, { error: message });
          await db.collection(collectionName).createIndex(spec);
          console.log(`✓ ${collectionName}: ${label} non-unique fallback`);
          return;
        }

        if (isIndexConflict) {
          logger.warn(`Index already exists or has conflicting options on ${collectionName} ${label}.`, { error: message });
          return;
        }

        throw error;
      }
    };

    // News collection indexes
    await safeCreateIndex('news', { status: 1, publishedAt: -1 }, undefined, '(status, publishedAt)');
    await safeCreateIndex('news', { category: 1, publishedAt: -1 }, undefined, '(category, publishedAt)');
    await safeCreateIndex('news', { isBreaking: 1, publishedAt: -1 }, undefined, '(isBreaking, publishedAt)');
    await safeCreateIndex('news', { id: 1 }, { unique: true }, '(id) unique');
    await safeCreateIndex('news', { slug: 1 }, { unique: true }, '(slug) unique');

    // User collection indexes
    await safeCreateIndex('users', { email: 1 }, { unique: true }, '(email) unique');
    await safeCreateIndex('users', { firebaseUid: 1 }, undefined, '(firebaseUid)');
    await safeCreateIndex('users', { id: 1 }, { unique: true }, '(id) unique');

    // Categories
    await safeCreateIndex('categories', { slug: 1 }, { unique: true }, '(slug) unique');
    await safeCreateIndex('categories', { isActive: 1 }, undefined, '(isActive)');

    // Ad impressions
    await safeCreateIndex('ad_impressions', { timestamp: -1 }, undefined, '(timestamp)');
    await safeCreateIndex('ad_impressions', { newsId: 1, timestamp: -1 }, undefined, '(newsId, timestamp)');

    // Newsletter
    await safeCreateIndex('newsletter', { email: 1 }, { unique: true }, '(email) unique');

    // Reading history
    await safeCreateIndex('reading_history', { userId: 1, lastRead: -1 }, undefined, '(userId, lastRead)');

    logger.info('All indexes created successfully');
    return true;
  } catch (error) {
    const logger = (await import('@/lib/logger')).default;
    logger.error('Index creation error', { error: error?.message || error });
    return false;
  }
}

// Convenience wrapper that obtains a DB and runs the index creation.
export async function ensureIndexes() {
  try {
    const { getDatabase } = await import('@/lib/mongodb');
    const db = await getDatabase();
    return await createIndexesFromDb(db);
  } catch (error) {
    console.error('ensureIndexes error:', error.message);
    return false;
  }
}
