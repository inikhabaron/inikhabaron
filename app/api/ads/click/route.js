import { getCollection } from '@/lib/mongodb';
import { json, preflight } from '@/lib/api/cors';

export const OPTIONS = preflight;

export async function POST(request) {
  try {
    const body = await request.json();
    const adsCollection = await getCollection('ad_impressions');
    await adsCollection.updateOne(
      { id: body.impressionId },
      { $set: { clicked: true, clickedAt: new Date() } }
    );
    return json({ success: true });
  } catch (error) {
    console.error('POST /api/ads/click error:', error);
    return json({ error: error.message }, { status: 500 });
  }
}
