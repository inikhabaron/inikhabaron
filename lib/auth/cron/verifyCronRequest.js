import { json } from '@/lib/api/cors';

/**
 * Guard for Vercel Cron-triggered routes.
 *
 * Usage inside a handler:
 *   const gate = verifyCronRequest(request);
 *   if (!gate.ok) return gate.response;
 *
 * Vercel signs cron requests with `Authorization: Bearer ${CRON_SECRET}`.
 */
export function verifyCronRequest(request) {
  const expected = process.env.CRON_SECRET;

  if (!expected) {
    return {
      ok: false,
      response: json({ error: 'CRON_SECRET not configured' }, { status: 500 }),
    };
  }

  const authHeader = request.headers.get('authorization');

  if (authHeader !== `Bearer ${expected}`) {
    return {
      ok: false,
      response: json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  return { ok: true };
}
