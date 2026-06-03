import { getCollection } from '@/lib/mongodb';
import logger from '@/lib/logger';

/**
 * Database schema migration utility
 * Fixes "odellerId" typo to "readingSessionId"
 */
export async function migrateReadingHistorySchema() {
  try {
    const historyCollection = await getCollection('reading_history');

    // Step 1: Add new field readingSessionId with same value as odellerId
    const result = await historyCollection.updateMany(
      { odellerId: { $exists: true }, readingSessionId: { $exists: false } },
      [{ $set: { readingSessionId: '$odellerId' } }]
    );

    logger.info(`Migrated reading_history`, { migrated: result.modifiedCount });

    // Step 2: Remove old odellerId field (optional - keep for backward compatibility)
    // await historyCollection.updateMany({}, { $unset: { odellerId: "" } });

    return { success: true, migratedCount: result.modifiedCount };
  } catch (error) {
    logger.error('Migration error', { error: error?.message || error });
    throw error;
  }
}

/**
 * Check migration status
 */
export async function checkMigrationStatus() {
  try {
    const historyCollection = await getCollection('reading_history');

    const withOdellerId = await historyCollection.countDocuments({ odellerId: { $exists: true } });
    const withReadingSessionId = await historyCollection.countDocuments({ readingSessionId: { $exists: true } });
    const total = await historyCollection.countDocuments({});

    return {
      total,
      withOdellerId,
      withReadingSessionId,
      migrationComplete: withOdellerId === 0 && withReadingSessionId === total,
    };
    } catch (error) {
    logger.error('Status check error', { error: error?.message || error });
    throw error;
  }
}
