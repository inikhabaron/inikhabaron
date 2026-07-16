import { getCollection } from '@/lib/mongodb';
import { json, preflight } from '@/lib/api/cors';
import { requireAdmin } from '@/lib/auth/admin/guard';

export const OPTIONS = preflight;

export async function GET(request) {
  try {
    // Admins only — this returns users' device push tokens + emails (PII).
    const gate = await requireAdmin(request, ['admin']);
    if (!gate.ok) return gate.response;

    const usersCollection = await getCollection('users');
    const users = await usersCollection.find({ fcmToken: { $ne: null } }).toArray();
    const tokens = users.map(u => ({ userId: u.id, token: u.fcmToken, email: u.email }));
    return json({ tokens, count: tokens.length });
  } catch (error) {
    console.error('GET /api/admin/push-tokens error:', error);
    return json({ error: error.message }, { status: 500 });
  }
}
