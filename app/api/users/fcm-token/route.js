import { getCollection } from '@/lib/mongodb';
import { json, preflight } from '@/lib/api/cors';

export const OPTIONS = preflight;

export async function POST(request) {
  try {
    const body = await request.json();
    const usersCollection = await getCollection('users');
    await usersCollection.updateOne(
      { firebaseUid: body.firebaseUid },
      { $set: { fcmToken: body.fcmToken, updatedAt: new Date() } }
    );
    return json({ success: true });
  } catch (error) {
    console.error('POST /api/users/fcm-token error:', error);
    return json({ error: error.message }, { status: 500 });
  }
}
