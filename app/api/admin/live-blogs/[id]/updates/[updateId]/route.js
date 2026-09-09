import { requireAdmin } from '@/lib/auth/admin/guard';
import { json, preflight } from '@/lib/api/cors';
import {
  updateLiveBlogUpdate, deleteLiveBlogUpdate, isValidLiveBlogUpdateStatus,
} from '@/lib/services/liveBlogs/liveBlogUpdateService';

export const dynamic = 'force-dynamic';
export const OPTIONS = preflight;

/** PUT /api/admin/live-blogs/[id]/updates/[updateId] — edit, or publish a drafted update. */
export async function PUT(request, { params }) {
  try {
    const gate = await requireAdmin(request, ['admin', 'editor']);
    if (!gate.ok) return gate.response;

    const { id, updateId } = await params;
    const body = await request.json().catch(() => ({}));

    if (body.status !== undefined && !isValidLiveBlogUpdateStatus(body.status)) {
      return json({ error: 'status must be "draft" or "published"' }, { status: 400, request });
    }

    const update = await updateLiveBlogUpdate(id, updateId, body);
    if (!update) return json({ error: 'Update not found' }, { status: 404, request });

    return json({ success: true, update }, { request });
  } catch (error) {
    console.error('PUT /api/admin/live-blogs/[id]/updates/[updateId] error:', error);
    return json({ error: 'Failed to update' }, { status: 500, request });
  }
}

/** DELETE /api/admin/live-blogs/[id]/updates/[updateId] */
export async function DELETE(request, { params }) {
  try {
    const gate = await requireAdmin(request, ['admin', 'editor']);
    if (!gate.ok) return gate.response;

    const { id, updateId } = await params;
    const result = await deleteLiveBlogUpdate(id, updateId);
    if (!result.deleted) return json({ error: 'Update not found' }, { status: 404, request });

    return json({ success: true }, { request });
  } catch (error) {
    console.error('DELETE /api/admin/live-blogs/[id]/updates/[updateId] error:', error);
    return json({ error: 'Failed to delete update' }, { status: 500, request });
  }
}
