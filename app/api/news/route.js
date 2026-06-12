import { getCollection } from '@/lib/mongodb';
import { json, preflight } from '@/lib/api/cors';
import { autoPublishScheduledArticles } from '@/lib/services/news';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const OPTIONS = preflight;

export async function GET(request) {
  try {
    await autoPublishScheduledArticles();
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

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } },
      ];
    }

    const [news, total] = await Promise.all([
      newsCollection.find(query).sort({ publishedAt: -1, createdAt: -1, _id: -1 }).skip(skip).limit(limit).toArray(),
      newsCollection.countDocuments(query),
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
