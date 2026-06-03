import { getCollection } from '@/lib/mongodb';

export async function autoPublishScheduledArticles() {
  try {
    const newsCollection = await getCollection('news');
    const now = new Date();
    const result = await newsCollection.updateMany(
      { status: 'scheduled', scheduledAt: { $lte: now } },
      { $set: { status: 'published', publishedAt: now, updatedAt: now } }
    );
    return result.modifiedCount;
  } catch (error) {
    const logger = (await import('@/lib/logger')).default;
    logger.error('Auto-publish error', { error: error?.message || error });
    return 0;
  }
}
