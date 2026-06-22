import { getCollection } from '@/lib/mongodb';
import { json, preflight } from '@/lib/api/cors';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const OPTIONS = preflight;

export async function POST(_request, { params }) {
  try {
    const { id: newsId } = await params;
    const newsCollection = await getCollection('news');

    const before = await newsCollection.findOne({ id: newsId });

    const result = await newsCollection.updateOne(
      { id: newsId },
      { $inc: { views: 1 } }
    );

    if (!result.matchedCount) {
      return json({ error: 'News not found' }, { status: 404 });
    }

    const after = await newsCollection.findOne({ id: newsId });

    return json({
      success: true,
      afterViews: after?.views ?? ((before?.views ?? 0) + 1),
    });
  } catch (error) {
    console.error('POST /api/news/[id]/view error:', error);
    return json({ error: error.message }, { status: 500 });
  }
}