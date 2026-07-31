import { json, preflight } from '@/lib/api/cors';
import { getMarketQuotes, DEFAULT_INSTRUMENT_IDS } from '@/lib/services/market/marketService';

// Reads per-request state (headers/cookies/query), so it can never be
// prerendered. Declared explicitly: without this Next attempts a static render
// at build time, the attempt throws DYNAMIC_SERVER_USAGE, and the route's own
// catch block logs it as an application error — the build-log noise.
export const dynamic = 'force-dynamic';

export const OPTIONS = preflight;

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const idsParam = searchParams.get('ids');
    const ids = idsParam ? idsParam.split(',').map((s) => s.trim()).filter(Boolean) : DEFAULT_INSTRUMENT_IDS;

    const quotes = await getMarketQuotes(ids);

    // Short cache — the ticker polls on its own interval, this just softens
    // a burst of simultaneous page loads hitting the route at once.
    return json({ quotes }, { request, headers: { 'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30' } });
  } catch (error) {
    console.error('GET /api/market/quotes error:', error);
    return json({ error: 'Failed to load market data', quotes: [] }, { status: 500, request });
  }
}
