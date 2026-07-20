import { getCollection } from '@/lib/mongodb';
import { COLLECTIONS } from '@/lib/constants/collections';
import { requireUser } from '@/lib/auth/user/requireUser';
import { json, preflight } from '@/lib/api/cors';

export const OPTIONS = preflight;

/**
 * POST /api/users/location/prompt-seen
 * Marks the location auto-detect prompt as answered (allowed, denied, or
 * dismissed) so it's never shown again for this user.
 */
export async function POST() {
  try {
    const auth = await requireUser();
    if (!auth.success) return auth.response;

    const usersCollection = await getCollection(COLLECTIONS.USERS);
    await usersCollection.updateOne(
      { id: auth.user.id },
      { $set: { locationPromptSeenAt: new Date() } }
    );

    return json({ success: true });
  } catch (error) {
    console.error('POST /api/users/location/prompt-seen error:', error);
    return json({ success: false, message: 'Unable to update.' }, { status: 500 });
  }
}
