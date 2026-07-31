import { json, preflight } from '@/lib/api/cors';
import { getUserFromToken } from '@/lib/auth/admin/token';
import { canAccessAdminPanel } from '@/lib/auth/permissions';
import { listJobs } from '@/lib/services/notifications/notificationJobService';

export const dynamic = 'force-dynamic';
export const OPTIONS = preflight;

// Read-only job list for the admin queue view. Firebase-free, like the metrics
// endpoint — operational tooling must not depend on the subsystem it inspects.
export async function GET(request) {
  try {
    const user = await getUserFromToken(request);
    if (!user || !canAccessAdminPanel(user)) {
      return json({ error: 'Unauthorized' }, { status: 403 });
    }
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const limit = Number(searchParams.get('limit')) || 50;

    const ALLOWED = ['pending', 'processing', 'sent', 'failed', 'cancelled'];
    if (status && !ALLOWED.includes(status)) {
      return json({ error: `Invalid status. Expected one of: ${ALLOWED.join(', ')}` }, { status: 400 });
    }
    return json({ success: true, data: await listJobs({ status, limit }) }, { status: 200 });
  } catch (error) {
    console.error('GET /api/admin/notifications/jobs error:', error);
    return json({ error: error.message }, { status: 500 });
  }
}
