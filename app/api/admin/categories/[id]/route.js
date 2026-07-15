import { getCollection } from '@/lib/mongodb';
import { json, preflight } from '@/lib/api/cors';
import { requireAdmin } from '@/lib/auth/admin/guard';

export const OPTIONS = preflight;

export async function PUT(request, { params }) {
  try {
    const gate = await requireAdmin(request, ['admin', 'editor']);
    if (!gate.ok) return gate.response;

    const { id } = await params;
    const body = await request.json();
    const categoriesCollection = await getCollection('categories');

    const updateData = { ...body, updatedAt: new Date() };
    delete updateData.id;
    delete updateData._id;

    const result = await categoriesCollection.updateOne({ id }, { $set: updateData });

    if (result.matchedCount === 0) {
      return json({ error: 'Category not found' }, { status: 404, request });
    }

    return json({ success: true }, { request });
  } catch (error) {
    console.error('PUT /api/admin/categories/[id] error:', error);
    return json({ error: 'Failed to update category' }, { status: 500, request });
  }
}

export async function DELETE(request, { params }) {
  try {
    const gate = await requireAdmin(request, ['admin', 'editor']);
    if (!gate.ok) return gate.response;

    const { id } = await params;
    const categoriesCollection = await getCollection('categories');
    await categoriesCollection.deleteOne({ id });
    return json({ success: true }, { request });
  } catch (error) {
    console.error('DELETE /api/admin/categories/[id] error:', error);
    return json({ error: 'Failed to delete category' }, { status: 500, request });
  }
}
