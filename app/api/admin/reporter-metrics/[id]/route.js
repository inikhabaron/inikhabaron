import { json, preflight } from '@/lib/api/cors';
import { requireAdmin } from '@/lib/auth/admin/guard';
import { getReporterMetricsById } from '@/lib/services/reporterMetrics/reporterMetricsService';

export const OPTIONS = preflight;

export async function GET(request, { params }) {
  try {
    const gate = await requireAdmin(request, ['admin', 'editor']);
    if (!gate.ok) return gate.response;

    const { id } = await params;
    const metrics = await getReporterMetricsById(id);

    if (!metrics) {
      return json({ error: 'Reporter not found' }, { status: 404 });
    }

    return json(metrics);
  } catch (error) {
    console.error('GET /api/admin/reporter-metrics/[id] error:', error);
    return json({ error: error.message }, { status: 500 });
  }
}
