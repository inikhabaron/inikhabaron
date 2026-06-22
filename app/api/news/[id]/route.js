import { getCollection } from '@/lib/mongodb';
import { json, preflight } from '@/lib/api/cors';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const OPTIONS = preflight;

export async function GET(_request, { params }) {
  try {
    const { id: newsId } = await params;
    const newsCollection = await getCollection('news');
    const news = await newsCollection.findOne({ id: newsId });

    if (!news) {
      return json({ error: 'News not found' }, { status: 404 });
    }

    return json(
      { news },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );
  } catch (error) {
    console.error('GET /api/news/[id] error:', error);
    return json({ error: error.message }, { status: 500 });
  }
}