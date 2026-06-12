import { getCollection } from '@/lib/mongodb';
import { json, preflight } from '@/lib/api/cors';
import { autoPublishScheduledArticles } from '@/lib/services/news';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const OPTIONS = preflight;

export async function GET() {
  try {
    await autoPublishScheduledArticles();
    const newsCollection = await getCollection('news');
    const news = await newsCollection
      .find({ status: 'published', isBreaking: true, publishedAt: { $lte: new Date() } })
      .sort({ publishedAt: -1 })
      .limit(10)
      .toArray();
    return json({ news },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    );
  } catch (error) {
    console.error('GET /api/news/breaking error:', error);
    return json({ error: error.message }, { status: 500 });
  }
}
