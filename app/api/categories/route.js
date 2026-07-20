import { getCollection } from '@/lib/mongodb';
import { json, preflight } from '@/lib/api/cors';

export const OPTIONS = preflight;

export async function GET() {
  try {
    const categoriesCollection = await getCollection('categories');
    const allCategories = await categoriesCollection.find({ isActive: true }).sort({ order: 1 }).toArray();
    const seen = new Set();
    const categories = allCategories.filter(c => seen.has(c.slug) ? false : seen.add(c.slug));
    return json({ categories }, { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } });
  } catch (error) {
    console.error('GET /api/categories error:', error);
    return json({ error: error.message }, { status: 500 });
  }
}
