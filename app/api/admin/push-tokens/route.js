import { getCollection } from '@/lib/mongodb';
import { json, preflight } from '@/lib/api/cors';
import { requireAdmin } from '@/lib/auth/admin/guard';
import { getAllTokenDocs } from '@/lib/services/notifications/pushTokenService';

export const OPTIONS = preflight;

export async function GET(request) {
  try {
    // Admins only — this returns users' device push tokens + emails (PII).
    const gate = await requireAdmin(request, ['admin']);
    if (!gate.ok) return gate.response;

    const tokenDocs = await getAllTokenDocs();
    if (!tokenDocs.length) return json({ tokens: [], count: 0 });

    const usersCollection = await getCollection('users');
    const userIds = [...new Set(tokenDocs.map((t) => t.userId))];
    const users = await usersCollection
      .find({ id: { $in: userIds } })
      .project({ id: 1, email: 1 })
      .toArray();
    const emailById = new Map(users.map((u) => [u.id, u.email]));

    const tokens = tokenDocs.map((t) => ({
      userId: t.userId,
      token: t.token,
      provider: t.provider,
      platform: t.platform,
      email: emailById.get(t.userId) || null,
      lastSeenAt: t.lastSeenAt,
    }));

    return json({ tokens, count: tokens.length });
  } catch (error) {
    console.error('GET /api/admin/push-tokens error:', error);
    return json({ error: error.message }, { status: 500 });
  }
}
