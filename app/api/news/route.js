import { getCollection } from '@/lib/mongodb';
import { json, preflight } from '@/lib/api/cors';
import { autoPublishScheduledArticles } from '@/lib/services/news';
import { sanitizeSearchQuery, validatePagination } from '@/lib/validation';
import { checkRateLimit, rateLimitResponse } from '@/lib/middleware/rateLimit';
import { withCache, getCacheKey, CACHE_DURATION } from '@/lib/cache';

export const OPTIONS = preflight;

export async function GET(request) {
  try {
    const ip = request.headers.get('x-forwarded-for') 
      || request.headers.get('cf-connecting-ip')
      || 'unknown';
    
    const { success } = await checkRateLimit(`search:${ip}`, 'search');
    if (!success) {
      return rateLimitResponse();
    }

    await autoPublishScheduledArticles();
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

    // Create cache key - only cache first page, no search queries
    const shouldCache = page === 1 && !search && (!category || category === 'all');
    const cacheKey = shouldCache ? getCacheKey('news', 'home', category || 'all') : null;

    const fetchNews = async () => {
      const [news, total] = await Promise.all([
        newsCollection
          .find(query)
          .sort(search ? { score: { $meta: 'textScore' } } : { publishedAt: -1 })
          .skip(skip)
          .limit(limit)
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
