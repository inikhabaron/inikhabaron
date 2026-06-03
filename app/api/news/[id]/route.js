import { getCollection } from '@/lib/mongodb';
import { json, preflight } from '@/lib/api/cors';
import { withCache, getCacheKey, CACHE_DURATION } from '@/lib/cache';

export const OPTIONS = preflight;

const CACHE_HEADERS = { 'Cache-Control': 'public, max-age=300, s-maxage=300' };

// L1 — per-process in-memory cache (0 ms, not shared across instances)
const articleCache = new Map();
const L1_TTL_MS = 5 * 60 * 1000; // 5 minutes

function l1Get(id) {
  const entry = articleCache.get(id);
  if (!entry) return null;
  if (Date.now() > entry.expiry) { articleCache.delete(id); return null; }
  return entry.data;
}

function l1Set(id, data) {
  articleCache.set(id, { data, expiry: Date.now() + L1_TTL_MS });
}

// Cache hit latency by layer:
//   L1 in-memory   ~0 ms   (same process)
//   L2 Redis        ~20 ms  (Upstash HTTP)
//   L3 MongoDB     ~490 ms  (remote server)
export async function GET(_request, { params }) {
  try {
    const { id: newsId } = await params;

    // L1: in-memory — fastest path, no network at all
    const memHit = l1Get(newsId);
    if (memHit) {
      return json({ news: memHit }, { headers: CACHE_HEADERS });
    }

    // L2 → L3: withCache checks Redis first; falls through to MongoDB only on
    // a full cache miss. On a Redis hit the MongoDB server is never touched.
    const newsCollection = await getCollection('news');
    const news = await withCache(
      getCacheKey('news', 'article', newsId),
      () => newsCollection.findOne({ id: newsId }),
      { ttl: CACHE_DURATION.MEDIUM }, // 5 minutes in Redis
    );

    if (!news) {
      return json({ error: 'News not found' }, { status: 404 });
    }

    // Warm L1 so the next request on this instance is instant
    l1Set(newsId, news);

    // View increment is non-critical — never delay the response for it
    newsCollection.updateOne({ id: newsId }, { $inc: { views: 1 } }).catch(console.error);

    return json({ news }, { headers: CACHE_HEADERS });
  } catch (error) {
    console.error('GET /api/news/[id] error:', error);
    return json({ error: error.message }, { status: 500 });
  }
}
