import { json, preflight } from '@/lib/api/cors';
import { getUserFromToken } from '@/lib/auth/admin/token';
import { canAccessAdminPanel } from '@/lib/auth/permissions';
import { getNotificationMetrics } from '@/lib/services/notifications/notificationMetricsService';

// Reads per-request auth headers, so it can never be prerendered.
export const dynamic = 'force-dynamic';

export const OPTIONS = preflight;

/**
 * Health of the asynchronous notification pipeline.
 *
 * Read-only and Firebase-free by design: a monitoring endpoint that depended on
 * the thing it monitors would go dark exactly when it was needed.
 */
export async function GET(request) {
  try {
    const user = await getUserFromToken(request);
    if (!user || !canAccessAdminPanel(user)) {
      return json({ error: 'Unauthorized' }, { status: 403 });
    }
    return json({ success: true, data: await getNotificationMetrics() }, { status: 200 });
  } catch (error) {
    console.error('GET /api/admin/notifications/metrics error:', error);
    return json({ error: error.message }, { status: 500 });
  }
}
