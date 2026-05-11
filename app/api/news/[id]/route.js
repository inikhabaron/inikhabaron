import { getCollection } from '@/lib/mongodb';
import { json, preflight } from '@/lib/api/cors';

export const OPTIONS = preflight;

export async function GET(_request, { params }) {
  try {
    const newsId = params.id;
    const newsCollection = await getCollection('news');
    const news = await newsCollection.findOne({ id: newsId });

    if (!news) {
      return json({ error: 'News not found' }, { status: 404 });
    }

    await newsCollection.updateOne({ id: newsId }, { $inc: { views: 1 } });
    return json({ news });
  } catch (error) {
    console.error('GET /api/news/[id] error:', error);
    return json({ error: error.message }, { status: 500 });
  }
}
