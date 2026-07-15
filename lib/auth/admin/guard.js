import { json } from '@/lib/api/cors';
import { getUserFromToken } from '@/lib/auth/admin/token';
import { checkRole } from '@/lib/auth/permissions';

/**
 * Guard for admin API routes.
 *
 * Usage inside a handler:
 *   const gate = await requireAdmin(request);            // any staff role
 *   if (!gate.ok) return gate.response;
 *   const user = gate.user;
 *
 *   const gate = await requireAdmin(request, ['admin']); // admins only
 *
 * Returns { ok:true, user } or { ok:false, response } with a 401/403 JSON body.
 */
export async function requireAdmin(request, roles = ['admin', 'editor', 'reporter']) {
  const user = await getUserFromToken(request);

  if (!user) {
    return {
      ok: false,
      response: json({ error: 'Authentication required' }, { status: 401 }),
    };
  }

  if (!checkRole(user, roles)) {
    return {
      ok: false,
      response: json({ error: 'Forbidden' }, { status: 403 }),
    };
  }

  return { ok: true, user };
}
