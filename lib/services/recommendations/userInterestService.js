import { COLLECTIONS } from '@/lib/constants/collections';
import { getDbCollection } from '@/lib/db';

async function getUserInterestsCollection() {
  return getDbCollection(
    COLLECTIONS.USER_INTERESTS,
    [
      {
        keys: {
          userId: 1,
        },
        options: {
          unique: true,
        },
      },
    ]
  );
}

export async function getStoredUserInterests(userId) {
  if (!userId) {
    return null;
  }

  const collection = await getUserInterestsCollection();

  return collection.findOne(
    {
      userId,
    },
    {
      projection: {
        _id: 0,
      },
    }
  );
}

export async function saveUserInterests(
  userId,
  interests
) {
  if (!userId) {
    throw new Error('User ID is required');
  }

  if (!interests) {
    throw new Error('Interests are required');
  }

  const collection = await getUserInterestsCollection();

  const now = new Date();

  await collection.updateOne(
    {
      userId,
    },
    {
      $set: {
        ...interests,
        updatedAt: now,
      },
      $setOnInsert: {
        createdAt: now,
      },
    },
    {
      upsert: true,
    }
  );

  return {
    success: true,
  };
}

export async function deleteUserInterests(userId) {
  if (!userId) {
    return false;
  }

  const collection = await getUserInterestsCollection();

  const result = await collection.deleteOne({
    userId,
  });

  return result.deletedCount > 0;
}