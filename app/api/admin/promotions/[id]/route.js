import { json, preflight } from '@/lib/api/cors';
import { requireAdmin } from '@/lib/auth/admin/guard';
import { updatePromotion, deletePromotion } from '@/lib/services/promotions/promotionService';

export const OPTIONS = preflight;

export async function PUT(request, { params }) {
  try {
    const gate = await requireAdmin(request, ['admin', 'editor']);
    if (!gate.ok) return gate.response;

    const { id } = await params;
    const body = await request.json();
    const promotion = await updatePromotion(id, body);

    if (!promotion) return json({ error: 'Promotion not found' }, { status: 404, request });
    return json({ success: true, promotion }, { request });
  } catch (error) {
    console.error('PUT /api/admin/promotions/[id] error:', error);
    return json({ error: 'Failed to update promotion' }, { status: 500, request });
  }
}

export async function DELETE(request, { params }) {
  try {
    const gate = await requireAdmin(request, ['admin', 'editor']);
    if (!gate.ok) return gate.response;

    const { id } = await params;
    const deleted = await deletePromotion(id);

    if (!deleted) return json({ error: 'Promotion not found' }, { status: 404, request });
    return json({ success: true }, { request });
  } catch (error) {
    console.error('DELETE /api/admin/promotions/[id] error:', error);
    return json({ error: 'Failed to delete promotion' }, { status: 500, request });
  }
}
