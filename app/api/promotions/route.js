import { json, preflight } from '@/lib/api/cors';
import { getActivePromotions } from '@/lib/services/promotions/promotionService';

export const OPTIONS = preflight;

// Public, read-only counterpart to /api/admin/promotions — mirrors the
// /api/categories vs /api/admin/categories split. Only enabled promotions
// inside their start/end window are returned (see
// promotionService.getActivePromotions), so the homepage never needs to
// re-check status/expiry itself.
export async function GET() {
  try {
    const promotions = await getActivePromotions();
    return json({ promotions }, { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } });
  } catch (error) {
    console.error('GET /api/promotions error:', error);
    return json({ error: error.message, promotions: [] }, { status: 500 });
  }
}
