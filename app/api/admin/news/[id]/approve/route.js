import { getCollection } from '@/lib/mongodb';
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
        $set: { status: 'published', publishedAt: new Date(), updatedAt: new Date() },
        $push: {
          approvalHistory: {
            action: 'approved',
            // Trust the authenticated user, not client-supplied ids.
            by: gate.user.id,
            byName: gate.user.name,
            at: new Date(),
            comment: body.comment || 'Approved for publication',
          },
        },
      }
    );

    return json({ success: result.modifiedCount > 0 }, { request });
  } catch (error) {
    console.error('POST /api/admin/news/[id]/approve error:', error);
    return json({ error: 'Failed to approve article' }, { status: 500, request });
  }
}
