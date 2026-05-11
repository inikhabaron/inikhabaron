import { getCollection } from '@/lib/mongodb';
import { v4 as uuidv4 } from 'uuid';
import { json, preflight } from '@/lib/api/cors';

export const OPTIONS = preflight;

export async function GET() {
  try {
    const tagsCollection = await getCollection('tags');
    const tags = await tagsCollection.find({}).sort({ createdAt: -1 }).toArray();
    return json({ tags });
  } catch (error) {
    console.error('GET /api/admin/tags error:', error);
    return json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const tagsCollection = await getCollection('tags');

    const tag = {
      id: uuidv4(),
      name: body.name,
      slug: body.slug || body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description: body.description || '',
      color: body.color || '#2563EB',
      isActive: body.isActive !== false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await tagsCollection.insertOne(tag);
    return json({ success: true, tag }, { status: 201 });
  } catch (error) {
    console.error('POST /api/admin/tags error:', error);
    return json({ error: error.message }, { status: 500 });
  }
}
