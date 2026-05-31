import { getCollection } from '@/lib/mongodb';
import { v4 as uuidv4 } from 'uuid';
import { json, preflight } from '@/lib/api/cors';

export const OPTIONS = preflight;

export async function POST(request, { params }) {
  try {
    const body = await request.json().catch(() => ({}));
    const newsCollection = await getCollection('news');

    const result = await newsCollection.updateOne(
      { id: params.id },
      {
        $set: { updatedAt: new Date() },
        $push: {
          corrections: {
            id: uuidv4(),
            text: body.text,
            by: body.userId,
            byName: body.userName,
            at: new Date(),
          },
        },
      }
    );

    return json({ success: result.modifiedCount > 0 });
  } catch (error) {
    console.error('POST /api/admin/news/[id]/correction error:', error);
    return json({ error: error.message }, { status: 500 });
  }
}
