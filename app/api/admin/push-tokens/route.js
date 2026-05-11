import { getCollection } from '@/lib/mongodb';
import { json, preflight } from '@/lib/api/cors';

export const OPTIONS = preflight;

export async function GET() {
  try {
    const usersCollection = await getCollection('users');
    const users = await usersCollection.find({ fcmToken: { $ne: null } }).toArray();
    const tokens = users.map(u => ({ userId: u.id, token: u.fcmToken, email: u.email }));
    return json({ tokens, count: tokens.length });
  } catch (error) {
    console.error('GET /api/admin/push-tokens error:', error);
    return json({ error: error.message }, { status: 500 });
  }
}
