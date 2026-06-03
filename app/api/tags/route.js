import { getCollection } from '@/lib/mongodb';
import { json, preflight } from '@/lib/api/cors';

export const OPTIONS = preflight;

export async function GET() {
  try {
    const tagsCollection = await getCollection('tags');
    const tags = await tagsCollection.find({}).sort({ createdAt: -1 }).toArray();
    return json({ tags });
  } catch (error) {
    console.error('GET /api/tags error:', error);
    return json({ error: error.message }, { status: 500 });
  }
}
