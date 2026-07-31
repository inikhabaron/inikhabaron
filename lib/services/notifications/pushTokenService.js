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

/**
 * Tokens for the given users, in a STABLE `_id` order.
 *
 * The ordering is required, not cosmetic: the delivery worker checkpoints its
 * progress as "everything up to _id X is done", and passing `afterId` resumes
 * from that point after a crash or retry. An unordered result would make the
 * checkpoint meaningless and cause re-sends.
 */
export async function getTokensForUserIds(userIds, { afterId } = {}) {
  if (!userIds?.length) return [];
  const tokens = await getPushTokensCollection();
  const filter = { userId: { $in: userIds } };
  if (afterId) filter._id = { $gt: afterId };
  return tokens.find(filter).sort({ _id: 1 }).toArray();
}

export async function getAllTokenDocs() {
  const tokens = await getPushTokensCollection();
  return tokens.find({}).toArray();
}
