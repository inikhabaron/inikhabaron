import { getCollection } from '@/lib/mongodb';
import { json, preflight } from '@/lib/api/cors';

export const OPTIONS = preflight;

export async function PUT(request, { params }) {
  try {
    const body = await request.json();
    const categoriesCollection = await getCollection('categories');

    const updateData = { ...body, updatedAt: new Date() };
    delete updateData.id;
    delete updateData._id;

    const result = await categoriesCollection.updateOne(
      { id: params.id },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return json({ error: 'Category not found' }, { status: 404 });
    }

    return json({ success: true });
  } catch (error) {
    console.error('PUT /api/admin/categories/[id] error:', error);
    return json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(_request, { params }) {
  try {
    const categoriesCollection = await getCollection('categories');
    await categoriesCollection.deleteOne({ id: params.id });
    return json({ success: true });
  } catch (error) {
    console.error('DELETE /api/admin/categories/[id] error:', error);
    return json({ error: error.message }, { status: 500 });
  }
}
