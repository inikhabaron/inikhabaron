import { getCollection } from '@/lib/mongodb';
import { v4 as uuidv4 } from 'uuid';
import { json, preflight } from '@/lib/api/cors';
import { requireAdmin } from '@/lib/auth/admin/guard';

export const OPTIONS = preflight;

export async function GET(request) {
  try {
    const gate = await requireAdmin(request);
    if (!gate.ok) return gate.response;

    const tagsCollection = await getCollection('tags');
    const tags = await tagsCollection.find({}).sort({ createdAt: -1 }).toArray();
    return json({ tags }, { request });
  } catch (error) {
    console.error('GET /api/admin/tags error:', error);
    return json({ error: 'Failed to load tags' }, { status: 500, request });
  }
}

export async function POST(request) {
  try {
    const gate = await requireAdmin(request, ['admin', 'editor']);
    if (!gate.ok) return gate.response;

    const body = await request.json();
    if (!body.name) return json({ error: 'Name is required' }, { status: 400, request });
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
    return json({ success: true, tag }, { status: 201, request });
  } catch (error) {
    console.error('POST /api/admin/tags error:', error);
    return json({ error: 'Failed to create tag' }, { status: 500, request });
  }
}
