import { getCollection } from '@/lib/mongodb';
import { json, preflight } from '@/lib/api/cors';

export const OPTIONS = preflight;

export async function PUT(request, { params }) {
  try {
    const body = await request.json();
    const tagsCollection = await getCollection('tags');

    const updateData = { ...body, updatedAt: new Date() };
    delete updateData.id;
    delete updateData._id;

    const result = await tagsCollection.updateOne(
      { id: params.id },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return json({ error: 'Tag not found' }, { status: 404 });
    }

    const updatedTag = await tagsCollection.findOne({ id: params.id });
    return json({ success: true, tag: updatedTag });
  } catch (error) {
    console.error('PUT /api/admin/tags/[id] error:', error);
    return json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(_request, { params }) {
  try {
    const tagsCollection = await getCollection('tags');
    await tagsCollection.deleteOne({ id: params.id });
    return json({ success: true });
  } catch (error) {
    console.error('DELETE /api/admin/tags/[id] error:', error);
    return json({ error: error.message }, { status: 500 });
  }
}
