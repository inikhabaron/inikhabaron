import { json, preflight } from '@/lib/api/cors';
import { getUserFromToken } from '@/lib/auth/admin/token';
import { checkRole, canAccessAdminPanel, canEditReel, canPublishReel, canModerateReel } from '@/lib/auth/permissions';
import { getReelsCollection } from '@/lib/db/reels';
import { getReel, updateReel, deleteReel } from '@/lib/services/reels/reelService';

// Reads per-request state (headers/cookies/query), so it can never be
// prerendered. Declared explicitly: without this Next attempts a static render
// at build time, the attempt throws DYNAMIC_SERVER_USAGE, and the route's own
// catch block logs it as an application error — the build-log noise.
export const dynamic = 'force-dynamic';

export const OPTIONS = preflight;

// Fields an admin form save is allowed to touch. Counters (views/likeCount/
// etc.), id, createdAt and createdBy are never accepted from the client.
const EDITABLE_FIELDS = [
  'title', 'description', 'video', 'thumbnail', 'category', 'tags',
  'reporterId', 'location', 'language', 'linkedArticleId',
  'isFeatured', 'isAd', 'sponsorId', 'campaignId',
  'status', 'scheduledAt',
];
const MODERATION_FIELDS = ['isSensitive', 'reportStatus'];

export async function GET(request, { params }) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return json({ error: 'Authentication required' }, { status: 401 });
    }
    if (!canAccessAdminPanel(user)) {
      return json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const reel = await getReel(id);
    if (!reel) {
      return json({ error: 'Reel not found' }, { status: 404 });
    }

    return json({ reel });
  } catch (error) {
    console.error('GET /api/admin/reels/[id] error:', error);
    return json({ error: error.message || 'Failed to load reel' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id } = await params;
    const reels = await getReelsCollection();
    const existing = await reels.findOne({ id });
    if (!existing) {
      return json({ error: 'Reel not found' }, { status: 404 });
    }

    if (!canEditReel(user, existing)) {
      return json({ error: 'Cannot edit this reel' }, { status: 403 });
    }

    const body = await request.json();

    if (body.status === 'published' && existing.status !== 'published' && !canPublishReel(user)) {
      return json({ error: 'Cannot publish this reel' }, { status: 403 });
    }

    const touchesModerationFields = MODERATION_FIELDS.some((field) => body[field] !== undefined);
    if (touchesModerationFields && !canModerateReel(user)) {
      return json({ error: 'Cannot moderate this reel' }, { status: 403 });
    }

    // Restoring a soft-deleted reel is admin-only, mirroring DELETE's gate.
    if (body.isDeleted !== undefined && !checkRole(user, ['admin'])) {
      return json({ error: 'Cannot restore this reel' }, { status: 403 });
    }

    const updateData = {};
    for (const field of EDITABLE_FIELDS) {
      if (body[field] !== undefined) updateData[field] = body[field];
    }
    if (touchesModerationFields) {
      for (const field of MODERATION_FIELDS) {
        if (body[field] !== undefined) updateData[field] = body[field];
      }
    }
    if (body.isDeleted !== undefined) {
      updateData.isDeleted = body.isDeleted;
      updateData.deletedAt = body.isDeleted ? new Date() : null;
    }

    const reel = await updateReel(id, updateData);
    if (!reel) {
      return json({ error: 'Reel not found' }, { status: 404 });
    }

    return json({ success: true, reel });
  } catch (error) {
    console.error('PUT /api/admin/reels/[id] error:', error);
    return json({ error: error.message || 'Failed to update reel' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return json({ error: 'Authentication required' }, { status: 401 });
    }
    if (!checkRole(user, ['admin'])) {
      return json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const reel = await deleteReel(id);
    if (!reel) {
      return json({ error: 'Reel not found' }, { status: 404 });
    }

    return json({ success: true });
  } catch (error) {
    console.error('DELETE /api/admin/reels/[id] error:', error);
    return json({ error: error.message || 'Failed to delete reel' }, { status: 500 });
  }
}
