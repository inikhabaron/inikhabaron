import { getCollection } from '@/lib/mongodb';

const DEBOUNCE_MS = 30 * 1000;
let lastRunAt = 0;

// Called on every GET to /api/news and /api/news/breaking, so this is a
// write fired on nearly every homepage view — debounce it to at most once
// per 30s per warm server instance instead of once per request.
export async function autoPublishScheduledArticles() {
  const now = Date.now();
  if (now - lastRunAt < DEBOUNCE_MS) return 0;
  lastRunAt = now;

  try {
    const newsCollection = await getCollection('news');
    const nowDate = new Date();
    const result = await newsCollection.updateMany(
      { status: 'scheduled', scheduledAt: { $lte: nowDate } },
      { $set: { status: 'published', publishedAt: nowDate, updatedAt: nowDate } }
    );
    return result.modifiedCount;
  } catch (error) {
    console.error('Auto-publish error:', error);
    return 0;
  }
}
