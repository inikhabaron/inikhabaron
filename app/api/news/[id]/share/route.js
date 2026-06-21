import { getCollection } from '@/lib/mongodb';
import { json, preflight } from '@/lib/api/cors';

export const OPTIONS = preflight;

const ALLOWED_PLATFORMS = ['whatsapp', 'facebook', 'twitter'];

export async function POST(request, { params }) {
  try {
    const body = await request.json().catch(() => ({}));
    const platform = String(body.platform || '').toLowerCase();

    if (!ALLOWED_PLATFORMS.includes(platform)) {
      return json({ error: 'Invalid platform' }, { status: 400 });
    }

    const newsCollection = await getCollection('news');

    const result = await newsCollection.updateOne(
      { id: params.id },
      {
        $inc: {
          [`shares.${platform}`]: 1,
        },
      }
    );

    return json({
      success: true,
      matched: result.matchedCount,
      modified: result.modifiedCount,
    });
  } catch (error) {
    console.error('POST /api/news/[id]/share error:', error);
    return json({ error: error.message }, { status: 500 });
  }
}