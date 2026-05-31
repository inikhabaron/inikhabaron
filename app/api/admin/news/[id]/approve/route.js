import { getCollection } from '@/lib/mongodb';
import { json, preflight } from '@/lib/api/cors';

export const OPTIONS = preflight;

export async function POST(request, { params }) {
  try {
    const body = await request.json().catch(() => ({}));
    const newsCollection = await getCollection('news');

    const result = await newsCollection.updateOne(
      { id: params.id },
      {
        $set: {
          status: 'published',
          publishedAt: new Date(),
          updatedAt: new Date(),
        },
        $push: {
          approvalHistory: {
            action: 'approved',
            by: body.userId,
            byName: body.userName,
            at: new Date(),
            comment: body.comment || 'Approved for publication',
          },
        },
      }
    );

    return json({ success: result.modifiedCount > 0 });
  } catch (error) {
    console.error('POST /api/admin/news/[id]/approve error:', error);
    return json({ error: error.message }, { status: 500 });
  }
}
