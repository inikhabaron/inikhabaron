import { json, preflight } from '@/lib/api/cors';
import { requireAdmin } from '@/lib/auth/admin/guard';
import { getReporterMetricsList } from '@/lib/services/reporterMetrics/reporterMetricsService';

export const OPTIONS = preflight;

export async function GET(request) {
  try {
    const gate = await requireAdmin(request, ['admin', 'editor']);
    if (!gate.ok) return gate.response;

    const reporters = await getReporterMetricsList();

    return json({ reporters });
  } catch (error) {
    console.error('GET /api/admin/reporter-metrics error:', error);
    return json({ error: error.message }, { status: 500 });
  }
}
