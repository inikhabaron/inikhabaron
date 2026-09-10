import { requireAdmin } from '@/lib/auth/admin/guard';
import { json, preflight } from '@/lib/api/cors';
import { getQueueHealth } from '@/lib/services/jobs/jobService';

export const dynamic = 'force-dynamic';
export const OPTIONS = preflight;

/**
 * GET /api/admin/jobs/status — per-kind async job queue health. Exists
 * because the equivalent notification-only metrics
 * (notificationMetricsService.getNotificationMetrics) already existed and
 * were never surfaced in any admin UI — the 139-job backlog went unnoticed
 * for over a month as a result. This is the platform-wide version, meant to
 * actually be looked at (see the admin dashboard's queue health card).
 */
export async function GET(request) {
  try {
    const gate = await requireAdmin(request);
    if (!gate.ok) return gate.response;

    const kinds = await getQueueHealth();
    return json({ kinds }, { request });
  } catch (error) {
    console.error('GET /api/admin/jobs/status error:', error);
    return json({ error: 'Failed to load job queue status' }, { status: 500, request });
  }
}
