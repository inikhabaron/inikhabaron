import { getCollection } from '@/lib/mongodb';
import { json, preflight } from '@/lib/api/cors';
import { autoPublishScheduledArticles } from '@/lib/services/news';

export const OPTIONS = preflight;

// In-memory cache with TTL (5 minutes for breaking news)
let cachedBreakingNews = null;
let cacheExpiry = 0;
let autoPublishLastRun = 0;

export async function GET() {
  try {
    // Return cached data if still valid
    if (cachedBreakingNews && Date.now() < cacheExpiry) {
      return json({ news: cachedBreakingNews }, {
        headers: {
          'Cache-Control': 'public, max-age=300, s-maxage=300',
          'CDN-Cache-Control': 'max-age=300',
        }
      });
    }

    // Only run autoPublish every 5 minutes to avoid overhead
    if (Date.now() - autoPublishLastRun > 5 * 60 * 1000) {
      autoPublishScheduledArticles().catch(err => console.error('Auto publish error:', err));
      autoPublishLastRun = Date.now();
    }

    const newsCollection = await getCollection('news');
    const news = await newsCollection
      .find({ status: 'published', isBreaking: true, publishedAt: { $lte: new Date() } })
      .sort({ publishedAt: -1 })
      .limit(10)
      .toArray();
    
    // Cache for 5 minutes
    cachedBreakingNews = news;
    cacheExpiry = Date.now() + (5 * 60 * 1000);

    return json({ news }, {
      headers: {
        'Cache-Control': 'public, max-age=300, s-maxage=300',
        'CDN-Cache-Control': 'max-age=300',
      }
    });
  } catch (error) {
    console.error('GET /api/news/breaking error:', error);
    return json({ error: error.message }, { status: 500 });
  }
}
