import { getCollection } from '@/lib/mongodb';
import { v4 as uuidv4 } from 'uuid';
import { json, preflight } from '@/lib/api/cors';

export const OPTIONS = preflight;

export async function POST(request) {
  try {
    const body = await request.json();
    const adsCollection = await getCollection('ad_impressions');

    const impression = {
      id: uuidv4(),
      adId: body.adId,
      adType: body.adType,
      placement: body.placement,
      userId: body.userId || null,
      sessionId: body.sessionId,
      newsId: body.newsId || null,
      timestamp: new Date(),
      clicked: false,
      revenue: body.estimatedRevenue || 0,
    };

    await adsCollection.insertOne(impression);
    return json({ success: true, impressionId: impression.id });
  } catch (error) {
    console.error('POST /api/ads/impression error:', error);
    return json({ error: error.message }, { status: 500 });
  }
}
