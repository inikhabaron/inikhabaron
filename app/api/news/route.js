import { getCollection } from '@/lib/mongodb';
import { json, preflight } from '@/lib/api/cors';
import { timeAsync } from '@/lib/perf/perfLog';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const OPTIONS = preflight;

// List views only ever render title/excerpt/image/category/date (+ content,
// which ArticleCard also needs for its reading-time word count) — these
// editorial/admin-only fields are never rendered here, so drop them from
// every list response instead of shipping full approval/version metadata
// for 20+ articles per page.
const LIST_EXCLUDE_PROJECTION = {
  approvalHistory: 0,
  headlineVariants: 0,
  versionHistory: 0,
  corrections: 0,
};

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    const newsCollection = await getCollection('news');
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '20');
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;
    const search = searchParams.get('search');

    let query = { status: 'published', publishedAt: { $lte: new Date() } };

    if (category && category !== 'all') {
      query.category = category;
    }

    let cursor;
    if (search) {
      // $text uses the news_text_search index (lib/db/ensureIndexes.js)
      // instead of an unindexed $regex scan across every published article.
      query.$text = { $search: search };
      cursor = newsCollection
        .find(query, { projection: { ...LIST_EXCLUDE_PROJECTION, score: { $meta: 'textScore' } } })
        .sort({ score: { $meta: 'textScore' } });
    } else {
      cursor = newsCollection
        .find(query, { projection: LIST_EXCLUDE_PROJECTION })
        .sort({ publishedAt: -1, createdAt: -1, _id: -1 });
    }

    const [news, total] = await Promise.all([
      timeAsync('news.find()', () => cursor.skip(skip).limit(limit).toArray()),
      timeAsync('news.countDocuments()', () => newsCollection.countDocuments(query)),
    ]);

    return json(
      {news, pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    );
  } catch (error) {
    console.error('GET /api/news error:', error);
    return json({ error: error.message }, { status: 500 });
  }
}
