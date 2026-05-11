import { getCollection } from '@/lib/mongodb';
import { json, preflight } from '@/lib/api/cors';

export const OPTIONS = preflight;

export async function GET() {
  try {
    const adsCollection = await getCollection('ad_impressions');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalImpressions, todayImpressions, totalClicks, todayClicks, revenueData] = await Promise.all([
      adsCollection.countDocuments({}),
      adsCollection.countDocuments({ timestamp: { $gte: today } }),
      adsCollection.countDocuments({ clicked: true }),
      adsCollection.countDocuments({ clicked: true, timestamp: { $gte: today } }),
      adsCollection.aggregate([{ $group: { _id: null, total: { $sum: '$revenue' } } }]).toArray(),
    ]);

    const byType = await adsCollection.aggregate([
      { $group: { _id: '$adType', impressions: { $sum: 1 }, clicks: { $sum: { $cond: ['$clicked', 1, 0] } } } },
    ]).toArray();

    const byPlacement = await adsCollection.aggregate([
      { $group: { _id: '$placement', impressions: { $sum: 1 }, clicks: { $sum: { $cond: ['$clicked', 1, 0] } } } },
    ]).toArray();

    return json({
      stats: {
        totalImpressions,
        todayImpressions,
        totalClicks,
        todayClicks,
        ctr: totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : 0,
        totalRevenue: revenueData[0]?.total || 0,
      },
      byType,
      byPlacement,
    });
  } catch (error) {
    console.error('GET /api/admin/ads/analytics error:', error);
    return json({ error: error.message }, { status: 500 });
  }
}
