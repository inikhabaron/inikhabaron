import { json, preflight } from '@/lib/api/cors';
import { requireAdmin } from '@/lib/auth/admin/guard';
import { scanMedia } from '@/lib/services/media/mediaScanService';

// Reads per-request state, so it can never be prerendered.
export const dynamic = 'force-dynamic';

export const OPTIONS = preflight;

// Scan only — this route has no code path that deletes anything. Deletion
// lives in ../delete, so an accidental GET can never destroy an asset.
export async function GET(request) {
  try {
    const gate = await requireAdmin(request, ['admin']);
    if (!gate.ok) return gate.response;

    const report = await scanMedia();
    return json(report, { request });
  } catch (error) {
    console.error('GET /api/admin/media-maintenance/scan error:', error);
    // Includes the "cannot read collection X" case from buildReferenceIndex:
    // an incomplete picture of what is referenced must fail the scan outright
    // rather than return a report that under-reports references.
    return json({ error: error.message || 'Scan failed' }, { status: 500, request });
  }
}
