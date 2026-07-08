import { getCollection } from '@/lib/mongodb';
import { json, preflight } from '@/lib/api/cors';
import { encodeToken } from '@/lib/auth/admin/token';

export const OPTIONS = preflight;

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { email, password } = body;

    if (!email || !password) {
      return json({ error: 'Email and password are required' }, { status: 400 });
    }

    const usersCollection = await getCollection('users');
    const user = await usersCollection.findOne({ email: email.toLowerCase() });

    if (!user) {
      return json({ error: 'Invalid email or password' }, { status: 401 });
    }

    if (!user.role || !['admin', 'editor', 'reporter'].includes(user.role)) {
      return json({ error: 'User account does not have admin access' }, { status: 403 });
    }

    if (user.password !== password) {
      return json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const token = encodeToken(user.id);
    const { password: _, ...userWithoutPassword } = user;
    const normalizedUser = {
      ...userWithoutPassword,
      role: userWithoutPassword.role?.toString().trim().toLowerCase(),
    };

    return json({ success: true, admin: normalizedUser, token });
  } catch (error) {
    console.error('POST /api/admin/login error:', error);
    return json({ error: error.message }, { status: 500 });
  }
}
