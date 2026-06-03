import { getCollection } from '@/lib/mongodb';
import { json, preflight } from '@/lib/api/cors';

export const OPTIONS = preflight;

// Per-process in-memory article cache.
// Keyed by news id. Fine for serverless — each instance caches independently.
const articleCache = new Map();
const ARTICLE_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function getCached(newsId) {
  const entry = articleCache.get(newsId);
  if (!entry) return null;
  if (Date.now() > entry.expiry) { articleCache.delete(newsId); return null; }
  return entry.data;
}

function setCached(newsId, data) {
  articleCache.set(newsId, { data, expiry: Date.now() + ARTICLE_CACHE_TTL_MS });
}

export async function GET(_request, { params }) {
  try {
    const { id: newsId } = await params;

    const cached = getCached(newsId);
    if (cached) {
      return json({ news: cached }, {
        headers: { 'Cache-Control': 'public, max-age=300, s-maxage=300' },
      });
    }

    const newsCollection = await getCollection('news');
    const news = await newsCollection.findOne({ id: newsId });

    if (!news) {
      return json({ error: 'News not found' }, { status: 404 });
    }

    setCached(newsId, news);

    // View increment is non-critical — fire and forget so it never delays the response
    newsCollection.updateOne({ id: newsId }, { $inc: { views: 1 } }).catch(console.error);

    return json({ news }, {
      headers: { 'Cache-Control': 'public, max-age=300, s-maxage=300' },
    });
  } catch (error) {
    console.error('GET /api/news/[id] error:', error);
    return json({ error: error.message }, { status: 500 });
  }
}
