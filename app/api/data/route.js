import { getCollection } from '@/lib/mongodb';
import { json, preflight } from '@/lib/api/cors';
import { withCache, getCacheKey, CACHE_DURATION } from '@/lib/cache';

export const OPTIONS = preflight;

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    const categoriesCollection = await getCollection('categories');
    const tagsCollection = await getCollection('tags');

    // Cache key-value results (rarely change)
    const cacheKey = getCacheKey('all-data');
    
    const data = await withCache(
      cacheKey,
      async () => {
        const [categories, tags] = await Promise.all([
          categoriesCollection
            .find({ isActive: true })
            .sort({ order: 1 })
            .toArray(),
          tagsCollection
            .find({ isActive: true })
            .sort({ name: 1 })
            .toArray(),
        ]);

        return { categories, tags };
      },
      { ttl: CACHE_DURATION.MEDIUM } // 5 minute cache for categories and tags
    );

    return json(data);
  } catch (error) {
    console.error('GET /api/data error:', error);
    return json({ error: error.message }, { status: 500 });
  }
}