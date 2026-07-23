import { getReelLikesCollection } from '@/lib/db/reelLikes';
import { getReelsCollection } from '@/lib/db/reels';

export async function addReelLike(userId, reelId) {
  const likes = await getReelLikesCollection();
  const reels = await getReelsCollection();

  const existing = await likes.findOne({ userId, reelId });
  if (existing) {
    const reel = await reels.findOne({ id: reelId });
    return { liked: true, alreadyExists: true, count: reel?.likeCount ?? 0 };
  }

  await likes.insertOne({
    userId,
    reelId,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const result = await reels.findOneAndUpdate(
    { id: reelId },
    { $inc: { likeCount: 1 }, $set: { updatedAt: new Date() } },
    { returnDocument: 'after' }
  );
  const reel = result?.value || result;

  return { liked: true, alreadyExists: false, count: reel?.likeCount ?? 0 };
}

export async function removeReelLike(userId, reelId) {
  const likes = await getReelLikesCollection();
  const reels = await getReelsCollection();

  const result = await likes.deleteOne({ userId, reelId });

  let reel;
  if (result.deletedCount > 0) {
    const updateResult = await reels.findOneAndUpdate(
      { id: reelId },
      { $inc: { likeCount: -1 }, $set: { updatedAt: new Date() } },
      { returnDocument: 'after' }
    );
    reel = updateResult?.value || updateResult;
  } else {
    reel = await reels.findOne({ id: reelId });
  }

  return { liked: false, deleted: result.deletedCount > 0, count: reel?.likeCount ?? 0 };
}

export async function getReelLikes(userId) {
  const likes = await getReelLikesCollection();
  const reels = await getReelsCollection();

  const likeDocs = await likes.find({ userId }).sort({ createdAt: -1 }).toArray();
  if (!likeDocs.length) {
    return { items: [], total: 0 };
  }

  const reelIds = likeDocs.map((like) => like.reelId);
  const reelDocs = await reels.find({ id: { $in: reelIds } }).toArray();

  const likeMap = new Map(likeDocs.map((like) => [like.reelId, like.createdAt]));
  const reelMap = new Map(reelDocs.map((reel) => [reel.id, reel]));

  const orderedReels = reelIds
    .map((reelId) => {
      const reel = reelMap.get(reelId);
      if (!reel) return null;
      return { ...reel, likedAt: likeMap.get(reelId) };
    })
    .filter(Boolean);

  return { items: orderedReels, total: orderedReels.length };
}

export async function isReelLiked(userId, reelId) {
  const likes = await getReelLikesCollection();
  const reels = await getReelsCollection();

  const like = await likes.findOne({ userId, reelId });
  const reel = await reels.findOne({ id: reelId });

  return { liked: !!like, likedAt: like?.createdAt || null, count: reel?.likeCount ?? 0 };
}

// One query for "which of this user's reels are liked" instead of N calls to
// isReelLiked() — mirrors getBookmarkedArticleIds's batching rationale for
// pages that render many like buttons at once (e.g. a feed).
export async function getLikedReelIds(userId) {
  const likes = await getReelLikesCollection();
  const docs = await likes.find({ userId }).project({ reelId: 1, _id: 0 }).toArray();
  return docs.map((doc) => doc.reelId);
}
