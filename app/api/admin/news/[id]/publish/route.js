import { getCollection } from '@/lib/mongodb';
import { json, preflight } from '@/lib/api/cors';
import { getUserFromToken } from '@/lib/auth/token';
import { canPublishArticle, normalizeStatus } from '@/lib/auth/permissions';

export const OPTIONS = preflight;

export async function POST(request, { params }) {
  try {
    const user = await getUserFromToken(request);
    if (!user || !canPublishArticle(user)) {
      return json({ error: 'Unauthorized - Admin only' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const newsCollection = await getCollection('news');

    const result = await newsCollection.updateOne(
      { id: params.id },
      {
        $set: {
          status: normalizeStatus('published'),
          publishedAt: new Date(),
          approvedBy: user.id,
          updatedAt: new Date(),
        },
        $push: {
          approvalHistory: {
            action: 'published',
            by: user.id,
            byName: user.name,
            at: new Date(),
            comment: body.comment || 'Published',
          },
        },
      }
    );

    return json({ success: result.modifiedCount > 0 });
  } catch (error) {
    console.error('POST /api/admin/news/[id]/publish error:', error);
    return json({ error: error.message }, { status: 500 });
  }
}
