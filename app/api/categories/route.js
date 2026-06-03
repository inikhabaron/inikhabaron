import { getCollection } from '@/lib/mongodb';
import { json, preflight } from '@/lib/api/cors';

export const OPTIONS = preflight;

// In-memory cache with TTL (1 hour)
let cachedCategories = null;
let cacheExpiry = 0;

export async function GET() {
  try {
    // Return cached data if still valid
    if (cachedCategories && Date.now() < cacheExpiry) {
      return json({ categories: cachedCategories }, {
        headers: {
          'Cache-Control': 'public, max-age=3600, s-maxage=3600',
          'CDN-Cache-Control': 'max-age=3600',
        }
      });
    }

    const categoriesCollection = await getCollection('categories');
    const allCategories = await categoriesCollection.find({ isActive: true }).sort({ order: 1 }).toArray();
    const seen = new Set();
    const categories = allCategories.filter(c => seen.has(c.slug) ? false : seen.add(c.slug));
    
    // Cache for 1 hour
    cachedCategories = categories;
    cacheExpiry = Date.now() + (60 * 60 * 1000);
    
    return json({ categories }, {
      headers: {
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
        'CDN-Cache-Control': 'max-age=3600',
      }
    });
  } catch (error) {
    console.error('GET /api/categories error:', error);
    return json({ error: error.message }, { status: 500 });
  }
}
