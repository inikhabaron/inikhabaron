import { getCollection } from '@/lib/mongodb';
import { json, preflight } from '@/lib/api/cors';
import { getUserFromToken } from '@/lib/auth/admin/token';
import { canApproveBreaking } from '@/lib/auth/permissions';

export const OPTIONS = preflight;

export async function POST(request, { params }) {
  try {
    const user = await getUserFromToken(request);
    if (!user || !canApproveBreaking(user)) {
      return json({ error: 'Unauthorized - Admin only' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const newsCollection = await getCollection('news');

    const result = await newsCollection.updateOne(
      { id: params.id },
      {
        $set: {
          isBreaking: true,
          breakingApproved: true,
          updatedAt: new Date(),
        },
        $push: {
          approvalHistory: {
            action: 'breaking_approved',
            by: user.id,
            byName: user.name,
            at: new Date(),
            comment: body.comment || 'Breaking news approved',
          },
        },
      }
    );

    return json({ success: result.modifiedCount > 0 });
  } catch (error) {
    console.error('POST /api/admin/news/[id]/approve-breaking error:', error);
    return json({ error: error.message }, { status: 500 });
  }
}
