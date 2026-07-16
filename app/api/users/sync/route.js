import { getCollection } from '@/lib/mongodb';
import { v4 as uuidv4 } from 'uuid';
import { json, preflight } from '@/lib/api/cors';

export const OPTIONS = preflight;

export async function POST(request) {
  try {
    const body = await request.json();
    const usersCollection = await getCollection('users');
    const existingUser = await usersCollection.findOne({ firebaseUid: body.firebaseUid });

    if (existingUser) {
      await usersCollection.updateOne(
        { firebaseUid: body.firebaseUid },
        {
          $set: {
            email: body.email,
            name: body.name,
            avatar: body.avatar,
            lastLogin: new Date(),
            updatedAt: new Date(),
          },
        }
      );
      const updatedUser = await usersCollection.findOne({ firebaseUid: body.firebaseUid });
      return json({ success: true, user: updatedUser, isNew: false });
    }

    const newUser = {
      id: uuidv4(),
      firebaseUid: body.firebaseUid,
      email: body.email,
      name: body.name,
      avatar: body.avatar,
      phone: body.phone || null,
      role: 'reader',
      isVerified: false,
      bio: '',
      fcmToken: body.fcmToken || null,
      preferences: { categories: [], notifications: true },
      followedCategories: [],
      followedAuthors: [],
      followedCities: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLogin: new Date(),
    };

    await usersCollection.insertOne(newUser);
    return json({ success: true, user: newUser, isNew: true }, { status: 201 });
  } catch (error) {
    console.error('POST /api/users/sync error:', error);
    return json({ error: error.message }, { status: 500 });
  }
}
