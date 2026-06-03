import { getCollection } from '@/lib/mongodb';
import { json, preflight } from '@/lib/api/cors';
import { autoPublishScheduledArticles } from '@/lib/services/news';
import { sanitizeSearchQuery, validatePagination } from '@/lib/validation';
import { checkRateLimit, rateLimitResponse } from '@/lib/middleware/rateLimit';
import { withCache, getCacheKey, CACHE_DURATION } from '@/lib/cache';

export const OPTIONS = preflight;

// Only fields needed for list cards — excludes full content HTML (major payload reduction)
const LIST_PROJECTION = {
  _id: 0,
  id: 1, title: 1, excerpt: 1, featuredImage: 1,
  category: 1, publishedAt: 1, isBreaking: 1, isTrending: 1,
  tags: 1, author: 1, authorName: 1, views: 1, slug: 1, status: 1,
};

// Throttle auto-publish to at most once per 60 s per process — avoids a
// write query blocking every single GET request. The cron job handles the
// real publishing in production; this is just a dev/fallback safety net.
let lastAutoPublishRun = 0;
const AUTO_PUBLISH_THROTTLE_MS = 60_000;

export async function GET(request) {
  try {
    const ip = request.headers.get('x-forwarded-for')
      || request.headers.get('cf-connecting-ip')
      || 'unknown';

    const { success } = await checkRateLimit(`search:${ip}`, 'search');
    if (!success) {
      return rateLimitResponse();
    }

    // Fire-and-forget, throttled — never blocks the response
    const now = Date.now();
    if (now - lastAutoPublishRun > AUTO_PUBLISH_THROTTLE_MS) {
      lastAutoPublishRun = now;
      autoPublishScheduledArticles().catch(console.error);
    }

    const url = new URL(request.url);
    const searchParams = url.searchParams;
    const newsCollection = await getCollection('news');

    const category = searchParams.get('category');
    const search = sanitizeSearchQuery(searchParams.get('search') || '');
    const { page, limit } = validatePagination(
      searchParams.get('page'),
      searchParams.get('limit')
    );

    const skip = (page - 1) * limit;

    let query = { status: 'published', publishedAt: { $lte: new Date() } };

    if (category && category !== 'all') {
      query.category = category;
    }

    if (search) {
      query.$text = { $search: search };
    }

    // Cache first page of every category (not just 'all'). Each category gets
    // its own Redis key so sports/politics/etc. hits are served from cache too.
    // Search queries are never cached — result space is unbounded.
    const shouldCache = page === 1 && !search;
    const cacheKey = shouldCache ? getCacheKey('news', 'list', category || 'all') : null;

    const fetchNews = async () => {
      const [news, total] = await Promise.all([
        newsCollection
          .find(query)
          .sort(search ? { score: { $meta: 'textScore' } } : { publishedAt: -1 })
          .skip(skip)
          .limit(limit)
          .project(LIST_PROJECTION)
          .toArray(),
        newsCollection.countDocuments(query),
      ]);

      return {
        news,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      };
    };

    let result;
    if (shouldCache && cacheKey) {
      result = await withCache(
        cacheKey,
        fetchNews,
        { ttl: CACHE_DURATION.MEDIUM } // 5 minute cache
      );
    } else {
      result = await fetchNews();
    }

    return json(result, {
      headers: {
        'Cache-Control': 'public, max-age=60, s-maxage=60',
        'CDN-Cache-Control': 'max-age=60',
      }
    });
  } catch (error) {
    console.error('GET /api/news error:', error);
    return json({ error: error.message }, { status: 500 });
  }
}
