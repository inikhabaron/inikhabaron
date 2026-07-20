import { requireUser } from '@/lib/auth/user/requireUser';
import { registerToken } from '@/lib/services/notifications/pushTokenService';
import { json, preflight } from '@/lib/api/cors';

export const OPTIONS = preflight;

export async function POST(request) {
  try {
    const auth = await requireUser();
    if (!auth.success) return auth.response;

    const body = await request.json();

    if (!body.token || !body.provider) {
      return json({ error: 'token and provider are required' }, { status: 400 });
    }
    if (!['fcm', 'expo'].includes(body.provider)) {
      return json({ error: 'provider must be fcm or expo' }, { status: 400 });
    }

    await registerToken(auth.user.id, {
      token: body.token,
      provider: body.provider,
      platform: body.platform || 'web',
      userAgent: request.headers.get('user-agent'),
    });

    return json({ success: true });
  } catch (error) {
    console.error('POST /api/users/fcm-token error:', error);
    return json({ error: error.message }, { status: 500 });
  }
}
