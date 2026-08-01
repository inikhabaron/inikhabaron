import { json, preflight } from '@/lib/api/cors';
import { requireAdmin } from '@/lib/auth/admin/guard';
import { verifyDeletable, MIN_AGE_MS } from '@/lib/services/media/mediaScanService';
import { recordDeletion } from '@/lib/services/media/mediaAuditLog';

export const dynamic = 'force-dynamic';

export const OPTIONS = preflight;

// The client must send this exact string. It exists so a stray POST — a
// replayed request, a mis-wired fetch, a curious script — cannot delete
// anything without having deliberately opted in.
const CONFIRMATION = 'DELETE';

// A single request cannot wipe the whole library even if the caller asks it to.
const MAX_PER_REQUEST = 100;

export async function POST(request) {
  try {
    const gate = await requireAdmin(request, ['admin']);
    if (!gate.ok) return gate.response;
    const admin = gate.user;

    const body = await request.json().catch(() => null);
    if (!body) return json({ error: 'Invalid request body' }, { status: 400, request });

    if (body.confirmation !== CONFIRMATION) {
      return json({ error: `Confirmation required: send confirmation: "${CONFIRMATION}"` }, { status: 400, request });
    }

    const publicIds = [...new Set((body.publicIds || []).filter((id) => typeof id === 'string' && id.trim()))];
    if (!publicIds.length) return json({ error: 'No assets specified' }, { status: 400, request });
    if (publicIds.length > MAX_PER_REQUEST) {
      return json({ error: `At most ${MAX_PER_REQUEST} assets per request (received ${publicIds.length})` }, { status: 400, request });
    }

    // Never trust the scan the admin was looking at. It is a snapshot, and an
    // editor may have attached one of these images to an article in the
    // meantime, so eligibility is decided again here against live data.
    const verdicts = await verifyDeletable(publicIds);
    const { deleteAsset } = await import('@/lib/cloudinary');

    const deleted = [];
    const refused = [];
    const failed = [];

    for (const verdict of verdicts) {
      if (!verdict.deletable) {
        refused.push({ publicId: verdict.publicId, reason: verdict.reason });
        continue;
      }

      const { asset } = verdict;
      const { success, error } = await deleteAsset(verdict.publicId, asset.resourceType);

      await recordDeletion({
        adminId: admin.id,
        adminName: admin.name || null,
        adminEmail: admin.email || null,
        publicId: verdict.publicId,
        url: asset.url,
        folder: asset.folder,
        resourceType: asset.resourceType,
        bytes: asset.bytes,
        assetCreatedAt: asset.createdAt ? new Date(asset.createdAt) : null,
        reason: `No database reference found; asset older than ${MIN_AGE_MS / 3_600_000}h. Verified immediately before deletion.`,
        outcome: success ? 'deleted' : 'failed',
        error: success ? null : error,
      });

      if (success) deleted.push(verdict.publicId);
      else failed.push({ publicId: verdict.publicId, error });
    }

    return json({
      requested: publicIds.length,
      deleted,
      refused,
      failed,
      reclaimedBytes: verdicts
        .filter((v) => deleted.includes(v.publicId))
        .reduce((n, v) => n + (v.asset?.bytes || 0), 0),
    }, { request });
  } catch (error) {
    console.error('POST /api/admin/media-maintenance/delete error:', error);
    return json({ error: error.message || 'Delete failed' }, { status: 500, request });
  }
}
