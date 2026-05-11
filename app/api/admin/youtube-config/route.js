import { getCollection } from '@/lib/mongodb';
import { json, preflight } from '@/lib/api/cors';

export const OPTIONS = preflight;

export async function GET() {
  try {
    const configCollection = await getCollection('config');
    const config = await configCollection.findOne({ key: 'youtube' });
    return json({ config: config || {} });
  } catch (error) {
    console.error('GET /api/admin/youtube-config error:', error);
    return json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { videoId, channelId, title, isLive } = body;
    const configCollection = await getCollection('config');

    await configCollection.updateOne(
      { key: 'youtube' },
      {
        $set: {
          key: 'youtube',
          videoId: videoId || null,
          channelId: channelId || null,
          title: title || null,
          isLive: !!isLive,
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );

    return json({ success: true });
  } catch (error) {
    console.error('POST /api/admin/youtube-config error:', error);
    return json({ error: error.message }, { status: 500 });
  }
}
