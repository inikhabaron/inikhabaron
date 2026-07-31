import { getCollection } from '@/lib/mongodb';
import { json, preflight } from '@/lib/api/cors';
import { getUserFromToken } from '@/lib/auth/admin/token';
import { canMarkBreaking } from '@/lib/auth/permissions';
import { queueBreakingNotification } from '@/lib/services/notifications/articleNotificationQueue';

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
          // Ordering key for the public ticker (/api/news/breaking); cleared on
          // unmark so a re-marked article gets a fresh position rather than its
          // original one.
          breakingAt: isBreaking ? new Date() : null,
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
      if (article) await queueBreakingNotification(article, user.id);
    }

    return json({ success: result.modifiedCount > 0 });
  } catch (error) {
    console.error('POST /api/admin/news/[id]/breaking error:', error);
    return json({ error: error.message }, { status: 500 });
  }
}
