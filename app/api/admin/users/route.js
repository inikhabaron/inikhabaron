import { getCollection } from '@/lib/mongodb';
import { v4 as uuidv4 } from 'uuid';
import { json, preflight } from '@/lib/api/cors';

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
    const usersCollection = await getCollection('users');

    const user = {
      id: uuidv4(),
      email: body.email.toLowerCase(),
      password: body.password,
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
    return json({ success: true, user }, { status: 201 });
  } catch (error) {
    console.error('POST /api/admin/users error:', error);
    return json({ error: error.message }, { status: 500 });
  }
}
