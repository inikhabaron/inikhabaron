import { getCollection } from '@/lib/mongodb';
import { v4 as uuidv4 } from 'uuid';
import { json, preflight } from '@/lib/api/cors';
import { requireAdmin } from '@/lib/auth/admin/guard';

export const OPTIONS = preflight;

export async function GET(request) {
  try {
    const gate = await requireAdmin(request);
    if (!gate.ok) return gate.response;

    const categoriesCollection = await getCollection('categories');
    const allCategories = await categoriesCollection.find({}).sort({ order: 1 }).toArray();
    const seen = new Set();
    const categories = allCategories.filter(c => seen.has(c.slug) ? false : seen.add(c.slug));
    return json({ categories }, { request });
  } catch (error) {
    console.error('GET /api/admin/categories error:', error);
    return json({ error: 'Failed to load categories' }, { status: 500, request });
  }
}

export async function POST(request) {
  try {
    const gate = await requireAdmin(request, ['admin', 'editor']);
    if (!gate.ok) return gate.response;

    const body = await request.json();
    if (!body.name) return json({ error: 'Name is required' }, { status: 400, request });
    const categoriesCollection = await getCollection('categories');

    const category = {
      id: uuidv4(),
      name: body.name,
      nameHi: body.nameHi,
      slug: body.slug || body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      parentSlug: body.parentSlug || '',
      description: body.description || '',
      icon: body.icon || null,
      color: body.color || '#3B82F6',
      order: body.order || 0,
      isActive: body.isActive !== false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await categoriesCollection.insertOne(category);
    return json({ success: true, category }, { status: 201, request });
  } catch (error) {
    console.error('POST /api/admin/categories error:', error);
    return json({ error: 'Failed to create category' }, { status: 500, request });
  }
}
