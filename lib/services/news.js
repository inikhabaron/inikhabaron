import { getCollection } from '@/lib/mongodb';
import { timeAsync } from '@/lib/perf/perfLog';

const DEBOUNCE_MS = 30 * 1000;
let lastRunAt = 0;

// Only called from app/api/cron/auto-publish/route.js now — previously ran
// on every GET to /api/news, /api/news/breaking and /api/admin/news (a write
// fired on nearly every homepage view). The debounce below is harmless
// leftover insurance against overlapping cron/external-scheduler invocations,
// not load-bearing anymore now that this isn't on the request hot path.
export async function autoPublishScheduledArticles() {
  const now = Date.now();
  if (now - lastRunAt < DEBOUNCE_MS) return 0;
  lastRunAt = now;

  try {
    return await timeAsync('Auto Publish (news.updateMany)', async () => {
      const newsCollection = await getCollection('news');
      const nowDate = new Date();
      const result = await newsCollection.updateMany(
        { status: 'scheduled', scheduledAt: { $lte: nowDate } },
        { $set: { status: 'published', publishedAt: nowDate, updatedAt: nowDate } }
      );
      return result.modifiedCount;
    });
  } catch (error) {
    console.error('Auto-publish error:', error);
    return 0;
  }
}
