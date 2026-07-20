import { getPushTokensCollection } from '@/lib/db/pushTokens';

export async function registerToken(userId, { token, provider, platform, userAgent }) {
  const tokens = await getPushTokensCollection();
  const now = new Date();

  await tokens.updateOne(
    { token },
    {
      $set: { userId, provider, platform, userAgent: userAgent || null, lastSeenAt: now },
      $setOnInsert: { createdAt: now },
    },
    { upsert: true }
  );

  return { registered: true };
}

export async function removeToken(token) {
  const tokens = await getPushTokensCollection();
  const result = await tokens.deleteOne({ token });
  return { removed: result.deletedCount > 0 };
}

export async function getTokensForUserIds(userIds) {
  if (!userIds?.length) return [];
  const tokens = await getPushTokensCollection();
  return tokens.find({ userId: { $in: userIds } }).toArray();
}

export async function getAllTokenDocs() {
  const tokens = await getPushTokensCollection();
  return tokens.find({}).toArray();
}
