import { getReelBookmarksCollection } from '@/lib/db/reelBookmarks';
import { getReelsCollection } from '@/lib/db/reels';

export async function addReelBookmark(userId, reelId) {
  const bookmarks = await getReelBookmarksCollection();
  const reels = await getReelsCollection();

  const existing = await bookmarks.findOne({ userId, reelId });
  if (existing) {
    const reel = await reels.findOne({ id: reelId });
    return { bookmarked: true, alreadyExists: true, count: reel?.bookmarkCount ?? 0 };
  }

  await bookmarks.insertOne({
    userId,
    reelId,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const result = await reels.findOneAndUpdate(
    { id: reelId },
    { $inc: { bookmarkCount: 1 }, $set: { updatedAt: new Date() } },
    { returnDocument: 'after' }
  );
  const reel = result?.value || result;

  return { bookmarked: true, alreadyExists: false, count: reel?.bookmarkCount ?? 0 };
}

export async function removeReelBookmark(userId, reelId) {
  const bookmarks = await getReelBookmarksCollection();
  const reels = await getReelsCollection();

  const result = await bookmarks.deleteOne({ userId, reelId });

  let reel;
  if (result.deletedCount > 0) {
    const updateResult = await reels.findOneAndUpdate(
      { id: reelId },
      { $inc: { bookmarkCount: -1 }, $set: { updatedAt: new Date() } },
      { returnDocument: 'after' }
    );
    reel = updateResult?.value || updateResult;
  } else {
    reel = await reels.findOne({ id: reelId });
  }

  return { bookmarked: false, deleted: result.deletedCount > 0, count: reel?.bookmarkCount ?? 0 };
}

export async function getReelBookmarks(userId) {
  const bookmarksCollection = await getReelBookmarksCollection();
  const reels = await getReelsCollection();

  const bookmarkDocs = await bookmarksCollection.find({ userId }).sort({ createdAt: -1 }).toArray();
  if (!bookmarkDocs.length) {
    return { items: [], total: 0 };
  }

  const reelIds = bookmarkDocs.map((bookmark) => bookmark.reelId);
  const reelDocs = await reels.find({ id: { $in: reelIds } }).toArray();

  const bookmarkMap = new Map(bookmarkDocs.map((bookmark) => [bookmark.reelId, bookmark.createdAt]));
  const reelMap = new Map(reelDocs.map((reel) => [reel.id, reel]));

  const orderedReels = reelIds
    .map((reelId) => {
      const reel = reelMap.get(reelId);
      if (!reel) return null;
      return { ...reel, bookmarkedAt: bookmarkMap.get(reelId) };
    })
    .filter(Boolean);

  return { items: orderedReels, total: orderedReels.length };
}

export async function isReelBookmarked(userId, reelId) {
  const bookmarks = await getReelBookmarksCollection();
  const reels = await getReelsCollection();

  const bookmark = await bookmarks.findOne({ userId, reelId });
  const reel = await reels.findOne({ id: reelId });

  return { bookmarked: !!bookmark, bookmarkedAt: bookmark?.createdAt || null, count: reel?.bookmarkCount ?? 0 };
}

// One query for "which of this user's reels are bookmarked" instead of N
// calls to isReelBookmarked() — mirrors getBookmarkedArticleIds.
export async function getBookmarkedReelIds(userId) {
  const bookmarks = await getReelBookmarksCollection();
  const docs = await bookmarks.find({ userId }).project({ reelId: 1, _id: 0 }).toArray();
  return docs.map((doc) => doc.reelId);
}
