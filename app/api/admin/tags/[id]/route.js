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
    const tagsCollection = await getCollection('tags');

    const updateData = { ...body, updatedAt: new Date() };
    delete updateData.id;
    delete updateData._id;

    const result = await tagsCollection.updateOne({ id }, { $set: updateData });

    if (result.matchedCount === 0) {
      return json({ error: 'Tag not found' }, { status: 404, request });
    }

    const updatedTag = await tagsCollection.findOne({ id });
    return json({ success: true, tag: updatedTag }, { request });
  } catch (error) {
    console.error('PUT /api/admin/tags/[id] error:', error);
    return json({ error: 'Failed to update tag' }, { status: 500, request });
  }
}

export async function DELETE(request, { params }) {
  try {
    const gate = await requireAdmin(request, ['admin', 'editor']);
    if (!gate.ok) return gate.response;

    const { id } = await params;
    const tagsCollection = await getCollection('tags');
    await tagsCollection.deleteOne({ id });
    return json({ success: true }, { request });
  } catch (error) {
    console.error('DELETE /api/admin/tags/[id] error:', error);
    return json({ error: 'Failed to delete tag' }, { status: 500, request });
  }
}
