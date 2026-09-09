import { requireAdmin } from '@/lib/auth/admin/guard';
import { json, preflight } from '@/lib/api/cors';
import { getLiveBlogById } from '@/lib/services/liveBlogs/liveBlogService';
import {
  createLiveBlogUpdate, getLiveBlogUpdatesForAdmin, isValidLiveBlogUpdateStatus,
} from '@/lib/services/liveBlogs/liveBlogUpdateService';
import { queueLiveBlogUpdateNotification } from '@/lib/services/notifications/articleNotificationQueue';

export const dynamic = 'force-dynamic';
export const OPTIONS = preflight;

/** GET /api/admin/live-blogs/[id]/updates — every update, any status, for the manage view. */
export async function GET(request, { params }) {
  try {
    const gate = await requireAdmin(request);
    if (!gate.ok) return gate.response;

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || 50;

    const data = await getLiveBlogUpdatesForAdmin(id, { page, limit });
    return json(data, { request });
  } catch (error) {
    console.error('GET /api/admin/live-blogs/[id]/updates error:', error);
    return json({ error: 'Failed to load updates' }, { status: 500, request });
  }
}

/** POST /api/admin/live-blogs/[id]/updates — post a new update. */
export async function POST(request, { params }) {
  try {
    const gate = await requireAdmin(request, ['admin', 'editor']);
    if (!gate.ok) return gate.response;

    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    if (!body.content) return json({ error: 'Content is required' }, { status: 400, request });
    if (body.status !== undefined && !isValidLiveBlogUpdateStatus(body.status)) {
      return json({ error: 'status must be "draft" or "published"' }, { status: 400, request });
    }

    const blog = await getLiveBlogById(id);
    if (!blog) return json({ error: 'Live blog not found' }, { status: 404, request });

    const update = await createLiveBlogUpdate(id, {
      content: body.content,
      media: body.media,
      status: body.status,
      authorId: gate.user.id,
    });

    // Only a 'breaking'-type blog's *published* updates notify (locked
    // 2026-09-09) — a drafted update never does, and neither does any
    // update on a general/sports/election blog (those only notify once,
    // when the blog itself goes live — see PUT [id]/route.js).
    if (update.status === 'published' && blog.type === 'breaking') {
      await queueLiveBlogUpdateNotification(blog, update, gate.user.id);
    }

    return json({ success: true, update }, { status: 201, request });
  } catch (error) {
    console.error('POST /api/admin/live-blogs/[id]/updates error:', error);
    return json({ error: 'Failed to create update' }, { status: 500, request });
  }
}
