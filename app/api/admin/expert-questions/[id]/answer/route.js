import { requireAdmin } from '@/lib/auth/admin/guard';
import { json, preflight } from '@/lib/api/cors';
import { submitAnswer } from '@/lib/services/expert/expertAnswerService';

export const dynamic = 'force-dynamic';
export const OPTIONS = preflight;

const REASON_STATUS = {
  EMPTY_ANSWER: 400,
  QUESTION_NOT_FOUND: 404,
  QUESTION_HIDDEN: 409,
  ALREADY_ANSWERED: 409,
};

/** POST /api/admin/expert-questions/[id]/answer — answer a pending question. Body: { answer: string } */
export async function POST(request, { params }) {
  try {
    const gate = await requireAdmin(request);
    if (!gate.ok) return gate.response;
    if (!gate.user.isExpert) {
      return json({ error: 'Forbidden' }, { status: 403, request });
    }

    const { id } = await params;
    const { answer } = await request.json().catch(() => ({}));

    const result = await submitAnswer(gate.user.id, id, answer);
    if (!result.success) {
      return json({ error: result.reason }, { status: REASON_STATUS[result.reason] || 400, request });
    }

    return json({ success: true, answer: result.answer }, { request });
  } catch (error) {
    console.error('POST /api/admin/expert-questions/[id]/answer error:', error);
    return json({ error: 'Failed to submit answer' }, { status: 500, request });
  }
}
