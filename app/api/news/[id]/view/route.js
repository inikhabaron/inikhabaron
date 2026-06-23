import { getCollection } from '@/lib/mongodb';
import { json, preflight } from '@/lib/api/cors';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const OPTIONS = preflight;

export async function POST(_request, { params }) {
  try {
    const { id: newsId } = await params;
    const newsCollection = await getCollection('news');

    const result = await newsCollection.findOneAndUpdate(
      { id: newsId },
      {
        $inc: { views: 1 },
        $set: { updatedAt: new Date() },
      },
      {
        returnDocument: 'after',
      }
    );

    const article = result?.value || result;

    if (!article) {
      return json({ error: 'News not found' }, { status: 404 });
    }

    return json({
      success: true,
      afterViews: article.views ?? 0,
    });
  } catch (error) {
    console.error('POST /api/news/[id]/view error:', error);
    return json({ error: error.message || 'Failed to record view' }, { status: 500 });
  }
}