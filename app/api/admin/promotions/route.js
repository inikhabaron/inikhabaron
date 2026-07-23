import { json, preflight } from '@/lib/api/cors';
import { requireAdmin } from '@/lib/auth/admin/guard';
import { createPromotion, getAllPromotions } from '@/lib/services/promotions/promotionService';

export const OPTIONS = preflight;

export async function GET(request) {
  try {
    const gate = await requireAdmin(request);
    if (!gate.ok) return gate.response;

    const promotions = await getAllPromotions();
    return json({ promotions }, { request });
  } catch (error) {
    console.error('GET /api/admin/promotions error:', error);
    return json({ error: 'Failed to load promotions' }, { status: 500, request });
  }
}

export async function POST(request) {
  try {
    const gate = await requireAdmin(request, ['admin', 'editor']);
    if (!gate.ok) return gate.response;

    const body = await request.json();
    if (!body.title) return json({ error: 'Title is required' }, { status: 400, request });

    const promotion = await createPromotion(body);
    return json({ success: true, promotion }, { status: 201, request });
  } catch (error) {
    console.error('POST /api/admin/promotions error:', error);
    return json({ error: 'Failed to create promotion' }, { status: 500, request });
  }
}
