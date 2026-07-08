import { getCollection } from '@/lib/mongodb';
import { json, preflight } from '@/lib/api/cors';
import { getUserFromToken } from '@/lib/auth/admin/token';
import { canApproveTrending } from '@/lib/auth/permissions';

export const OPTIONS = preflight;

export async function POST(request, { params }) {
  try {
    const user = await getUserFromToken(request);
    if (!user || !canApproveTrending(user)) {
      return json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const newsCollection = await getCollection('news');

    const result = await newsCollection.updateOne(
      { id: params.id },
      {
        $set: { isTrending: true, updatedAt: new Date() },
        $push: {
          approvalHistory: {
            action: 'trending_approved',
            by: user.id,
            byName: user.name,
            at: new Date(),
            comment: body.comment || 'Trending status approved',
          },
        },
      }
    );

    return json({ success: result.modifiedCount > 0 });
  } catch (error) {
    console.error('POST /api/admin/news/[id]/approve-trending error:', error);
    return json({ error: error.message }, { status: 500 });
  }
}
