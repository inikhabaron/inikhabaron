import { getCollection } from '@/lib/mongodb';
import { json, preflight } from '@/lib/api/cors';

export const OPTIONS = preflight;

// In-memory cache with TTL (1 hour)
let cachedTags = null;
let cacheExpiry = 0;

export async function GET() {
  try {
    // Return cached data if still valid
    if (cachedTags && Date.now() < cacheExpiry) {
      return json({ tags: cachedTags }, {
        headers: {
          'Cache-Control': 'public, max-age=3600, s-maxage=3600',
          'CDN-Cache-Control': 'max-age=3600',
        }
      });
    }

    const tagsCollection = await getCollection('tags');
    const tags = await tagsCollection.find({}).sort({ createdAt: -1 }).toArray();
    
    // Cache for 1 hour
    cachedTags = tags;
    cacheExpiry = Date.now() + (60 * 60 * 1000);
    
    return json({ tags }, {
      headers: {
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
        'CDN-Cache-Control': 'max-age=3600',
      }
    });
  } catch (error) {
    console.error('GET /api/tags error:', error);
    return json({ error: error.message }, { status: 500 });
  }
}
