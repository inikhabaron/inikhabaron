import { requireAdmin } from '@/lib/auth/admin/guard';
import { json, preflight } from '@/lib/api/cors';
import { getPendingQuestions } from '@/lib/services/expert/expertQuestionService';

export const dynamic = 'force-dynamic';
export const OPTIONS = preflight;

/**
 * GET /api/admin/expert-questions — the expert queue (pending questions).
 * Gated on the isExpert capability flag, not a role — any staff member can
 * be flagged as an expert regardless of their admin/editor/reporter role.
 */
export async function GET(request) {
  try {
    const gate = await requireAdmin(request);
    if (!gate.ok) return gate.response;
    if (!gate.user.isExpert) {
      return json({ error: 'Forbidden' }, { status: 403, request });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || undefined;
    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || 20;

    const data = await getPendingQuestions({ category, page, limit });
    return json(data, { request });
  } catch (error) {
    console.error('GET /api/admin/expert-questions error:', error);
    return json({ error: 'Failed to load questions' }, { status: 500, request });
  }
}
