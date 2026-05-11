import { getCollection } from '@/lib/mongodb';
import { v4 as uuidv4 } from 'uuid';
import { json, preflight } from '@/lib/api/cors';
import { getUserFromToken } from '@/lib/auth/token';
import { canReviewArticle } from '@/lib/auth/permissions';

export const OPTIONS = preflight;

export async function POST(request, { params }) {
  try {
    const user = await getUserFromToken(request);
    if (!user || !canReviewArticle(user)) {
      return json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const newsCollection = await getCollection('news');

    const result = await newsCollection.updateOne(
      { id: params.id },
      {
        $set: { status: 'NEEDS_REVISION', reviewedBy: user.id, updatedAt: new Date() },
        $push: {
          approvalHistory: {
            action: 'sent_back',
            by: user.id,
            byName: user.name,
            at: new Date(),
            comment: body.comment || 'Needs revision',
          },
          corrections: {
            id: uuidv4(),
            text: body.comment || 'Please revise the article',
            by: user.id,
            byName: user.name,
            at: new Date(),
          },
        },
      }
    );

    return json({ success: result.modifiedCount > 0 });
  } catch (error) {
    console.error('POST /api/admin/news/[id]/revise error:', error);
    return json({ error: error.message }, { status: 500 });
  }
}
