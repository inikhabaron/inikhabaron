import { getCollection } from '@/lib/mongodb';
import { v4 as uuidv4 } from 'uuid';
import { json, preflight } from '@/lib/api/cors';
import { requireAdmin } from '@/lib/auth/admin/guard';
import { hashPassword } from '@/lib/auth/admin/password';

export const OPTIONS = preflight;

export async function GET(request) {
  try {
    // Admins only — this endpoint previously had NO auth and leaked passwords.
    const gate = await requireAdmin(request, ['admin']);
    if (!gate.ok) return gate.response;

    const usersCollection = await getCollection('users');
    // Never return the password field.
    const users = await usersCollection
      .find({}, { projection: { password: 0 } })
      .sort({ createdAt: -1 })
      .toArray();
    return json({ users }, { request });
  } catch (error) {
    console.error('GET /api/admin/users error:', error);
    return json({ error: 'Failed to load users' }, { status: 500, request });
  }
}

export async function POST(request) {
  try {
    // Admins only — this previously let anyone create an admin account.
    const gate = await requireAdmin(request, ['admin']);
    if (!gate.ok) return gate.response;

    const body = await request.json();
    if (!body.email || !body.password) {
      return json({ error: 'Email and password are required' }, { status: 400, request });
    }
    const usersCollection = await getCollection('users');

    const user = {
      id: uuidv4(),
      email: body.email.toLowerCase(),
      password: hashPassword(body.password),
      name: body.name,
      role: (body.role || 'reporter').toString().trim().toLowerCase(),
      isVerified: body.isVerified || false,
      bio: body.bio || '',
      avatar: body.avatar || null,
      permissions: {
        canPublishScheduled: body.canPublishScheduled || false,
        canPublishBreaking: body.canPublishBreaking || false,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await usersCollection.insertOne(user);
    const { password: _pw, ...safeUser } = user;
    return json({ success: true, user: safeUser }, { status: 201, request });
  } catch (error) {
    console.error('POST /api/admin/users error:', error);
    return json({ error: 'Failed to create user' }, { status: 500, request });
  }
}
