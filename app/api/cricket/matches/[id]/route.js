import { json, preflight } from '@/lib/api/cors';
import { getMatchDetail, getPollIntervalMs, isCricketConfigured, isCricketEnabled, isRateLimited } from '@/lib/services/cricket/cricketService';

export const dynamic = 'force-dynamic';

export const OPTIONS = preflight;

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const match = await getMatchDetail(id);
    const [refreshIntervalMs, enabled, rateLimited] = await Promise.all([
      getPollIntervalMs(match ? [match] : []),
      isCricketEnabled(),
      isRateLimited(),
    ]);

    if (!match) {
      return json({ error: 'Match not found', match: null, configured: isCricketConfigured(), enabled, refreshIntervalMs, rateLimited }, { status: 404, request });
    }

    return json(
      { match, configured: isCricketConfigured(), enabled, refreshIntervalMs, rateLimited },
      { request, headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' } },
    );
  } catch (error) {
    console.error('GET /api/cricket/matches/[id] error:', error);
    return json({ error: 'Failed to load match', match: null, configured: isCricketConfigured(), enabled: false }, { status: 500, request });
  }
}
