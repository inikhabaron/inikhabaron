import { requireAdmin } from '@/lib/auth/admin/guard';
import { json, preflight } from '@/lib/api/cors';
import {
  getLiveBlogById, updateLiveBlog, deleteLiveBlog, isValidLiveBlogStatus, isValidLiveBlogType,
} from '@/lib/services/liveBlogs/liveBlogService';
import { queueLiveBlogPublishedNotification } from '@/lib/services/notifications/articleNotificationQueue';

export const dynamic = 'force-dynamic';
export const OPTIONS = preflight;

/** PUT /api/admin/live-blogs/[id] — update metadata and/or status transition. */
export async function PUT(request, { params }) {
  try {
    const gate = await requireAdmin(request, ['admin', 'editor']);
    if (!gate.ok) return gate.response;

    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    if (body.type !== undefined && !isValidLiveBlogType(body.type)) {
      return json({ error: 'type must be one of election, sports, breaking, general' }, { status: 400, request });
    }
    if (body.status !== undefined && !isValidLiveBlogStatus(body.status)) {
      return json({ error: 'status must be one of draft, live, completed, archived' }, { status: 400, request });
    }

    // Fetched before the write so the notification only fires on a genuine
    // draft/completed/archived -> live transition, never on every edit to
    // an already-live blog.
    const before = await getLiveBlogById(id);
    if (!before) return json({ error: 'Live blog not found' }, { status: 404, request });

    const blog = await updateLiveBlog(id, body);
    if (!blog) return json({ error: 'Live blog not found' }, { status: 404, request });

    if (before.status !== 'live' && blog.status === 'live') {
      await queueLiveBlogPublishedNotification(blog, gate.user.id);
    }

    return json({ success: true, blog }, { request });
  } catch (error) {
    console.error('PUT /api/admin/live-blogs/[id] error:', error);
    return json({ error: 'Failed to update live blog' }, { status: 500, request });
  }
}

/** DELETE /api/admin/live-blogs/[id] — cascade-deletes its updates too. */
export async function DELETE(request, { params }) {
  try {
    const gate = await requireAdmin(request, ['admin', 'editor']);
    if (!gate.ok) return gate.response;

    const { id } = await params;
    const result = await deleteLiveBlog(id);
    if (!result.deleted) return json({ error: 'Live blog not found' }, { status: 404, request });

    return json({ success: true }, { request });
  } catch (error) {
    console.error('DELETE /api/admin/live-blogs/[id] error:', error);
    return json({ error: 'Failed to delete live blog' }, { status: 500, request });
  }
}
