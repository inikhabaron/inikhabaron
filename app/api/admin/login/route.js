import { getCollection } from '@/lib/mongodb';
import { json, preflight } from '@/lib/api/cors';
import { encodeToken } from '@/lib/auth/admin/token';
import { verifyPassword, hashPassword, isHashed } from '@/lib/auth/admin/password';

export const OPTIONS = preflight;

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { email, password } = body;

    if (!email || !password) {
      return json({ error: 'Email and password are required' }, { status: 400, request });
    }

    const usersCollection = await getCollection('users');
    const user = await usersCollection.findOne({ email: email.toLowerCase() });

    // Generic message for all auth failures (avoid user enumeration).
    const invalid = () => json({ error: 'Invalid email or password' }, { status: 401, request });

    if (!user) return invalid();

    if (!user.role || !['admin', 'editor', 'reporter'].includes(user.role)) {
      return json({ error: 'User account does not have admin access' }, { status: 403, request });
    }

    // Verify password. Legacy plaintext passwords are transparently migrated to
    // a scrypt hash on the first successful login.
    let passwordOk;
    if (isHashed(user.password)) {
      passwordOk = verifyPassword(password, user.password);
    } else {
      passwordOk = user.password === password;
      if (passwordOk) {
        await usersCollection.updateOne(
          { id: user.id },
          { $set: { password: hashPassword(password), updatedAt: new Date() } }
        );
      }
    }

    if (!passwordOk) return invalid();

    const token = encodeToken(user);
    const { password: _pw, ...userWithoutPassword } = user;
    const normalizedUser = {
      ...userWithoutPassword,
      role: userWithoutPassword.role?.toString().trim().toLowerCase(),
    };

    return json({ success: true, admin: normalizedUser, token }, { request });
  } catch (error) {
    console.error('POST /api/admin/login error:', error);
    return json({ error: 'Login failed' }, { status: 500, request });
  }
}
