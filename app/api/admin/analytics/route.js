import { getCollection } from '@/lib/mongodb';
import { json, preflight } from '@/lib/api/cors';

export const OPTIONS = preflight;

export async function GET() {
  try {
    const newsCollection = await getCollection('news');
    const usersCollection = await getCollection('users');

    const [totalNews, publishedNews, draftNews, pendingNews, totalViews, totalUsers] = await Promise.all([
      newsCollection.countDocuments({}),
      newsCollection.countDocuments({ status: 'published' }),
      newsCollection.countDocuments({ status: 'draft' }),
      newsCollection.countDocuments({ status: 'pending' }),
      newsCollection.aggregate([{ $group: { _id: null, total: { $sum: '$views' } } }]).toArray(),
      usersCollection.countDocuments({}),
    ]);

    const topArticles = await newsCollection
      .find({ status: 'published' })
      .sort({ views: -1 })
      .limit(10)
      .toArray();

    return json({
      stats: {
        totalNews,
        publishedNews,
        draftNews,
        pendingNews,
        totalViews: totalViews[0]?.total || 0,
        totalUsers,
      },
      topArticles,
    });
  } catch (error) {
    console.error('GET /api/admin/analytics error:', error);
    return json({ error: error.message }, { status: 500 });
  }
}
