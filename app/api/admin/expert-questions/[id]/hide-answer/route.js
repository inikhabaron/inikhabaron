import { requireAdmin } from '@/lib/auth/admin/guard';
import { json, preflight } from '@/lib/api/cors';
import { hideAnswer } from '@/lib/services/expert/expertAnswerService';

export const dynamic = 'force-dynamic';
export const OPTIONS = preflight;

/** POST /api/admin/expert-questions/[id]/hide-answer — moderation: hide a published answer without hiding the question itself. Any staff role. */
export async function POST(request, { params }) {
  try {
    const gate = await requireAdmin(request);
    if (!gate.ok) return gate.response;

    const { id } = await params;
    const result = await hideAnswer(id);
    if (!result.success) {
      return json({ error: 'Answer not found' }, { status: 404, request });
    }

    return json({ success: true }, { request });
  } catch (error) {
    console.error('POST /api/admin/expert-questions/[id]/hide-answer error:', error);
    return json({ error: 'Failed to hide answer' }, { status: 500, request });
  }
}
