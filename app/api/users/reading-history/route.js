import { getCollection } from '@/lib/mongodb';
import { json, preflight } from '@/lib/api/cors';

export const OPTIONS = preflight;

export async function POST(request) {
  try {
    const body = await request.json();
    const historyCollection = await getCollection('reading_history');

    // Create session ID (unique per user + article)
    const readingSessionId = body.readingSessionId || `${body.userId}_${body.newsId}`;

    await historyCollection.updateOne(
      { 
        $or: [
          { readingSessionId },
          { odellerId: readingSessionId } // Support old field name for backward compatibility
        ]
      },
      {
        $set: {
          readingSessionId, // New standardized field name
          userId: body.userId,
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
