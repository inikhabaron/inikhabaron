import { json, preflight } from '@/lib/api/cors';
import { requireAdmin } from '@/lib/auth/admin/guard';
import { getCricketSettings, updateCricketSettings } from '@/lib/services/cricket/cricketSettingsService';

export const dynamic = 'force-dynamic';

export const OPTIONS = preflight;

export async function GET(request) {
  try {
    const gate = await requireAdmin(request, ['admin']);
    if (!gate.ok) return gate.response;

    const settings = await getCricketSettings();
    return json({ success: true, settings }, { request });
  } catch (error) {
    console.error('GET /api/admin/settings/cricket error:', error);
    return json({ error: error.message || 'Failed to load settings' }, { status: 500, request });
  }
}

export async function POST(request) {
  try {
    const gate = await requireAdmin(request, ['admin']);
    if (!gate.ok) return gate.response;

    const body = await request.json();
    const settings = await updateCricketSettings(body, gate.user);
    return json({ success: true, settings }, { request });
  } catch (error) {
    console.error('POST /api/admin/settings/cricket error:', error);
    return json({ error: error.message || 'Failed to save settings' }, { status: 500, request });
  }
}
