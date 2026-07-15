import { getCollection } from '@/lib/mongodb';
import { v4 as uuidv4 } from 'uuid';
import { json, preflight } from '@/lib/api/cors';
import { requireAdmin } from '@/lib/auth/admin/guard';

export const OPTIONS = preflight;

export async function POST(request, { params }) {
  try {
    const gate = await requireAdmin(request, ['admin', 'editor']);
    if (!gate.ok) return gate.response;

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const newsCollection = await getCollection('news');

    const result = await newsCollection.updateOne(
      { id },
      {
        $set: { updatedAt: new Date() },
        $push: {
          corrections: {
            id: uuidv4(),
            text: body.text,
            by: gate.user.id,
            byName: gate.user.name,
            at: new Date(),
          },
        },
      }
    );

    return json({ success: result.modifiedCount > 0 }, { request });
  } catch (error) {
    console.error('POST /api/admin/news/[id]/correction error:', error);
    return json({ error: 'Failed to add correction' }, { status: 500, request });
  }
}
