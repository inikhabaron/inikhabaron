import { getCollection } from '@/lib/mongodb';
import { json, preflight } from '@/lib/api/cors';

export const OPTIONS = preflight;

export async function GET(_request, { params }) {
  try {
    const historyCollection = await getCollection('reading_history');
    const history = await historyCollection
      .find({ userId: params.id })
      .sort({ lastRead: -1 })
      .limit(20)
      .toArray();
    return json({ history });
  } catch (error) {
    console.error('GET /api/users/[id]/history error:', error);
    return json({ error: error.message }, { status: 500 });
  }
}
