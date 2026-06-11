import { getCollection } from '@/lib/mongodb';
import { json, preflight } from '@/lib/api/cors';

export const OPTIONS = preflight;

export async function POST(request, { params }) {
  try {
    const body = await request.json().catch(() => ({}));
    const platform = body.platform;
    console.log('Share API called');
    console.log('Article ID:', params.id);
    console.log('Platform:', platform);
    const newsCollection = await getCollection('news');
    const result = await newsCollection.updateOne(
      { id: params.id },
      { $inc: { [`shares.${platform}`]: 1, }, }
    );
    console.log('Matched:', result.matchedCount);
    console.log('Modified:', result.modifiedCount);
    return json({ success: true });
  } catch (error) {
    console.error('POST /api/news/[id]/share error:', error);
    return json({ error: error.message }, { status: 500 });
  }
}
