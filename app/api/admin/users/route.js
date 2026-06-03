import { getCollection } from '@/lib/mongodb';
import { v4 as uuidv4 } from 'uuid';
import { json, preflight } from '@/lib/api/cors';
import { hashPassword, validatePasswordStrength } from '@/lib/auth/password';

export const OPTIONS = preflight;

export async function GET() {
  try {
    const usersCollection = await getCollection('users');
    const users = await usersCollection.find({}).sort({ createdAt: -1 }).toArray();
    return json({ users });
  } catch (error) {
    console.error('GET /api/admin/users error:', error);
    return json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    
    if (!body.email || !body.name || !body.password) {
      return json({ error: 'Email, name, and password required' }, { status: 400 });
    }

    const passwordCheck = validatePasswordStrength(body.password);
    if (!passwordCheck.valid) {
      return json({ error: passwordCheck.message }, { status: 400 });
    }

    const usersCollection = await getCollection('users');
    
    const existing = await usersCollection.findOne({ email: body.email.toLowerCase() });
    if (existing) {
      return json({ error: 'User already exists' }, { status: 409 });
    }

    const passwordHash = await hashPassword(body.password);

    const user = {
      id: uuidv4(),
      email: body.email.toLowerCase(),
      passwordHash,
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
    const { passwordHash: _, ...userWithoutPassword } = user;
    return json({ success: true, user: userWithoutPassword }, { status: 201 });
  } catch (error) {
    console.error('POST /api/admin/users error:', error);
    return json({ error: error.message }, { status: 500 });
  }
}
