import { requireAdmin } from '@/lib/auth/admin/guard';
import { json, preflight } from '@/lib/api/cors';
import {
  createLiveBlog, getLiveBlogs, isValidLiveBlogType,
} from '@/lib/services/liveBlogs/liveBlogService';

export const dynamic = 'force-dynamic';
export const OPTIONS = preflight;

/** GET /api/admin/live-blogs — list, including drafts (unlike the public route). */
export async function GET(request) {
  try {
    const gate = await requireAdmin(request);
    if (!gate.ok) return gate.response;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || 20;

    const data = await getLiveBlogs({ status, page, limit });
    return json(data, { request });
  } catch (error) {
    console.error('GET /api/admin/live-blogs error:', error);
    return json({ error: 'Failed to load live blogs' }, { status: 500, request });
  }
}

/** POST /api/admin/live-blogs — create, always starts as status:'draft'. */
export async function POST(request) {
  try {
    const gate = await requireAdmin(request, ['admin', 'editor']);
    if (!gate.ok) return gate.response;

    const body = await request.json().catch(() => ({}));
    if (!body.title) return json({ error: 'Title is required' }, { status: 400, request });
    if (!isValidLiveBlogType(body.type)) {
      return json({ error: 'type must be one of election, sports, breaking, general' }, { status: 400, request });
    }

    const blog = await createLiveBlog({
      title: body.title,
      type: body.type,
      featuredImage: body.featuredImage,
      summary: body.summary,
      linkedArticleId: body.linkedArticleId || null,
      createdBy: gate.user.id,
    });

    return json({ success: true, blog }, { status: 201, request });
  } catch (error) {
    console.error('POST /api/admin/live-blogs error:', error);
    return json({ error: 'Failed to create live blog' }, { status: 500, request });
  }
}
