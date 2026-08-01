import { json, preflight } from '@/lib/api/cors';
import { getMatches, getPollIntervalMs, getWidgetSettings, isCricketConfigured, isCricketEnabled, isRateLimited } from '@/lib/services/cricket/cricketService';

// Reads per-request state indirectly (no static data to prerender — this is
// always live), so it can never be prerendered at build time.
export const dynamic = 'force-dynamic';

export const OPTIONS = preflight;

export async function GET(request) {
  try {
    const matches = await getMatches();
    const [refreshIntervalMs, enabled, widget, rateLimited] = await Promise.all([
      getPollIntervalMs(matches),
      isCricketEnabled(),
      getWidgetSettings(),
      isRateLimited(),
    ]);

    // Short cache — the widget/list poll on their own interval, this just
    // softens a burst of simultaneous page loads hitting the route at once.
    return json(
      { matches, configured: isCricketConfigured(), enabled, refreshIntervalMs, widget, rateLimited },
      { request, headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' } },
    );
  } catch (error) {
    console.error('GET /api/cricket/matches error:', error);
    return json({ error: 'Failed to load cricket matches', matches: [], configured: isCricketConfigured(), enabled: false }, { status: 500, request });
  }
}
