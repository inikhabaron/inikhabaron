import { getCollection } from '@/lib/mongodb';
import { json, preflight } from '@/lib/api/cors';

export const OPTIONS = preflight;

// Only the fields needed for the breaking-news ticker and sidebar
const BREAKING_PROJECTION = {
  _id: 0,
  id: 1, title: 1, featuredImage: 1, category: 1,
  publishedAt: 1, isBreaking: 1, excerpt: 1, slug: 1,
};

let cachedBreaking = null;
let breakingCacheExpiry = 0;

export async function GET() {
  try {
    if (cachedBreaking && Date.now() < breakingCacheExpiry) {
      return json({ news: cachedBreaking }, {
        headers: { 'Cache-Control': 'public, max-age=120, s-maxage=120' },
      });
    }

    const newsCollection = await getCollection('news');
    const news = await newsCollection
      .find({ isBreaking: true, status: 'published' })
      .sort({ publishedAt: -1 })
      .limit(10)
      .project(BREAKING_PROJECTION)
      .toArray();

    cachedBreaking = news;
    breakingCacheExpiry = Date.now() + 2 * 60 * 1000; // 2 minutes

    return json({ news }, {
      headers: { 'Cache-Control': 'public, max-age=120, s-maxage=120' },
    });
  } catch (error) {
    console.error('GET /api/news/breaking error:', error);
    return json({ error: error.message }, { status: 500 });
  }
}
