import { requireAdmin } from '@/lib/auth/admin/guard';
import { json, preflight } from '@/lib/api/cors';
import { hideQuestion } from '@/lib/services/expert/expertQuestionService';

export const dynamic = 'force-dynamic';
export const OPTIONS = preflight;

/** POST /api/admin/expert-questions/[id]/hide — moderation: remove a spam/inappropriate question. Any staff role, not expert-gated. */
export async function POST(request, { params }) {
  try {
    const gate = await requireAdmin(request);
    if (!gate.ok) return gate.response;

    const { id } = await params;
    const result = await hideQuestion(id);
    if (!result.success) {
      return json({ error: 'Question not found' }, { status: 404, request });
    }

    return json({ success: true }, { request });
  } catch (error) {
    console.error('POST /api/admin/expert-questions/[id]/hide error:', error);
    return json({ error: 'Failed to hide question' }, { status: 500, request });
  }
}
