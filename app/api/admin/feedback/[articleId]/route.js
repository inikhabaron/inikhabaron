import { requireAdmin } from '@/lib/auth/admin/guard';
import { json, preflight } from '@/lib/api/cors';
import { getFeedbackForArticle } from '@/lib/services/feedback/feedbackService';

export const dynamic = 'force-dynamic';
export const OPTIONS = preflight;

/** GET /api/admin/feedback/[articleId] — individual feedback entries (with comments) for one article. */
export async function GET(request, { params }) {
  try {
    const gate = await requireAdmin(request);
    if (!gate.ok) return gate.response;

    const { articleId } = await params;
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || 20;

    const data = await getFeedbackForArticle(articleId, { page, limit });
    return json(data, { request });
  } catch (error) {
    console.error('GET /api/admin/feedback/[articleId] error:', error);
    return json({ error: 'Failed to load feedback' }, { status: 500, request });
  }
}
