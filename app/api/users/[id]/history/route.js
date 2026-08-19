import { getCollection } from '@/lib/mongodb';
import { json, preflight } from '@/lib/api/cors';
import { requireUser } from '@/lib/auth/user/requireUser';

export const dynamic = 'force-dynamic';

export const OPTIONS = preflight;

// Reading history is personal data. With no auth check, the id in the path was
// the only thing standing between a stranger and any account's history — and
// user ids are not secret, the public article feed carries author ids openly.
export async function GET(_request, { params }) {
  try {
    const auth = await requireUser();
    if (!auth.success) return auth.response;

    if (params.id !== auth.user.id) {
      return json({ error: 'Forbidden' }, { status: 403 });
    }

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
