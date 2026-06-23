import { getCollection } from '@/lib/mongodb';
import { json, preflight } from '@/lib/api/cors';

export const OPTIONS = preflight;

export async function POST(request) {
  try {
    const analyticsCollection = await getCollection('analytics');

    const body = await request.json().catch(() => ({}));
    const sessionId = String(body?.sessionId || '').trim();

    if (!sessionId) {
      return json({ error: 'sessionId is required' }, { status: 400 });
    }

    const now = new Date();
    const sessionKey = `session:${sessionId}`;

    // Try to insert this session only once
    const insertResult = await analyticsCollection.updateOne(
      { key: sessionKey },
      {
        $setOnInsert: {
          key: sessionKey,
          type: 'session',
          sessionId,
          createdAt: now,
        },
        $set: {
          lastSeenAt: now,
        },
      },
      { upsert: true }
    );

    // If this session was inserted for the first time, increment global totalSessions
    if (insertResult.upsertedCount > 0) {
      await analyticsCollection.updateOne(
        { key: 'global' },
        {
          $inc: { totalSessions: 1 },
          $set: { updatedAt: now },
          $setOnInsert: {
            key: 'global',
            createdAt: now,
          },
        },
        { upsert: true }
      );
    }

    const globalAnalytics = await analyticsCollection.findOne({ key: 'global' });

    return json({
      success: true,
      sessionId,
      insertedNewSession: insertResult.upsertedCount > 0,
      totalSessions: globalAnalytics?.totalSessions || 0,
    });
  } catch (error) {
    console.error('POST /api/analytics/session error:', error);
    return json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}