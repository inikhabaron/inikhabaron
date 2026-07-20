import { getCollection } from '@/lib/mongodb';
import { json, preflight } from '@/lib/api/cors';
import { getUserFromToken } from '@/lib/auth/admin/token';
import { canMarkBreaking } from '@/lib/auth/permissions';
import { notifyBreakingNews } from '@/lib/services/notifications/articleNotifications';

export const OPTIONS = preflight;

export async function POST(request, { params }) {
  try {
    const user = await getUserFromToken(request);
    if (!user || !canMarkBreaking(user)) {
      return json({ error: 'Unauthorized - Admin only' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const newsCollection = await getCollection('news');
    const isBreaking = body.isBreaking || false;

    const result = await newsCollection.updateOne(
      { id: params.id },
      {
        $set: {
          isBreaking,
          breakingApproved: isBreaking,
          updatedAt: new Date(),
        },
        $push: {
          approvalHistory: {
            action: isBreaking ? 'marked_breaking' : 'unmarked_breaking',
            by: user.id,
            byName: user.name,
            at: new Date(),
          },
        },
      }
    );

    if (isBreaking && result.modifiedCount > 0) {
      const article = await newsCollection.findOne({ id: params.id });
      if (article) await notifyBreakingNews(article, user.id);
    }

    return json({ success: result.modifiedCount > 0 });
  } catch (error) {
    console.error('POST /api/admin/news/[id]/breaking error:', error);
    return json({ error: error.message }, { status: 500 });
  }
}
