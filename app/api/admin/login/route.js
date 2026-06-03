import { getCollection } from '@/lib/mongodb';
import { json, preflight } from '@/lib/api/cors';
import { encodeToken } from '@/lib/auth/token';
import { verifyPassword } from '@/lib/auth/password';
import { checkRateLimit, rateLimitResponse } from '@/lib/middleware/rateLimit';

export const OPTIONS = preflight;

export async function POST(request) {
  try {
    if (!process.env.MONGO_URL) {
      return json({ error: 'Server misconfiguration: MONGO_URL is required' }, { status: 500 });
    }
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
      return json({ error: 'Server misconfiguration: JWT_SECRET must be at least 32 characters' }, { status: 500 });
    }

    // Extract IP for rate limiting
    const ip = request.headers.get('x-forwarded-for') 
      || request.headers.get('cf-connecting-ip')
      || 'unknown';
    
    // Rate limit by IP
    const { success } = await checkRateLimit(`login:${ip}`, 'login');
    
    if (!success) {
      return rateLimitResponse();
    }

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

    // Verify hashed password
    const passwordValid = await verifyPassword(password, user.passwordHash);
    if (!passwordValid) {
      return json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const token = encodeToken(user.id, user.role);
    const { passwordHash: _, ...userWithoutPassword } = user;
    const normalizedUser = {
      ...userWithoutPassword,
      role: userWithoutPassword.role?.toString().trim().toLowerCase(),
    };

    return json({ success: true, admin: normalizedUser, token, expiresIn: 604800 });
  } catch (error) {
    console.error('POST /api/admin/login error:', error);
    return json({ error: error.message }, { status: 500 });
  }
}
