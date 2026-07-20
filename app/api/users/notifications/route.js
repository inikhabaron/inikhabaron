import { getCollection } from '@/lib/mongodb';
import { requireUser } from '@/lib/auth/user/requireUser';
import { json, preflight } from '@/lib/api/cors';

export const OPTIONS = preflight;

export async function GET() {
  const auth = await requireUser();
  if (!auth.success) return auth.response;

  const enabled = auth.user.preferences?.notifications !== false;
  return json({ success: true, data: { enabled } });
}

export async function PUT(request) {
  const auth = await requireUser();
  if (!auth.success) return auth.response;

  const body = await request.json().catch(() => ({}));
  const enabled = body.enabled !== false;

  const usersCollection = await getCollection('users');
  await usersCollection.updateOne(
    { id: auth.user.id },
    { $set: { 'preferences.notifications': enabled, updatedAt: new Date() } }
  );

  return json({ success: true, data: { enabled } });
}
