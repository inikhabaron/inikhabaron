import { getCollection } from '@/lib/mongodb';
import { json, preflight } from '@/lib/api/cors';

export const OPTIONS = preflight;

export async function POST(request) {
  try {
    const body = await request.json();

    if (!body.firebaseUid) {
      return json({ error: 'firebaseUid is required' }, { status: 400 });
    }

    const usersCollection = await getCollection('users');

    // Web sends `fcmToken` (Firebase Cloud Messaging, web push).
    // Mobile (Expo) sends `expoPushToken` — kept as a separate field since a
    // reader can have both a web and a mobile session active at once.
    const update = { updatedAt: new Date() };
    if (body.fcmToken) update.fcmToken = body.fcmToken;
    if (body.expoPushToken) update.expoPushToken = body.expoPushToken;

    await usersCollection.updateOne(
      { firebaseUid: body.firebaseUid },
      { $set: update }
    );
    return json({ success: true });
  } catch (error) {
    console.error('POST /api/users/fcm-token error:', error);
    return json({ error: error.message }, { status: 500 });
  }
}
