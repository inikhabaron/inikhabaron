import { getCollection } from '@/lib/mongodb';
import { json, preflight } from '@/lib/api/cors';
import { requireUser } from '@/lib/auth/user/requireUser';

export const dynamic = 'force-dynamic';

export const OPTIONS = preflight;

// Whose history this is comes from the session, never the body. Unauthenticated
// with a caller-supplied `userId`, anyone could write reading history against
// any account — which is not just forged data, it is an input to the
// personalisation and recommendation engine that reads this collection.
export async function POST(request) {
  try {
    const auth = await requireUser();
    if (!auth.success) return auth.response;

    const body = await request.json();
    const historyCollection = await getCollection('reading_history');

    await historyCollection.updateOne(
      { odellerId: `${auth.user.id}_${body.newsId}` },
      {
        $set: {
          userId: auth.user.id,
          newsId: body.newsId,
          newsTitle: body.newsTitle,
          newsExcerpt: body.newsExcerpt || '',
          newsFeaturedImage: body.newsFeaturedImage || '',
          newsCategory: body.newsCategory || '',
          scrollPosition: body.scrollPosition || 0,
          readPercentage: body.readPercentage || 0,
          lastRead: new Date(),
        },
      },
      { upsert: true }
    );
    return json({ success: true });
  } catch (error) {
    console.error('POST /api/users/reading-history error:', error);
    return json({ error: error.message }, { status: 500 });
  }
}
