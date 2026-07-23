import { getReelCommentLikesCollection } from '@/lib/db/reelCommentLikes';
import { getReelCommentsCollection } from '@/lib/db/reelComments';

// Mirrors lib/services/comments/commentLikeService.js, but points at
// getReelCommentsCollection() instead of getCommentsCollection() — the
// original hardcodes the news comments collection to read back the `likes`
// count after each write, so it can't be reused as-is for reel comment ids.

export async function addReelCommentLike(userId, commentId) {
  const likesCollection = await getReelCommentLikesCollection();
  const commentsCollection = await getReelCommentsCollection();

  const existing = await likesCollection.findOne({ userId, commentId });
  if (existing) {
    const comment = await commentsCollection.findOne({ _id: commentId });
    return { liked: true, alreadyExists: true, likes: comment?.likes ?? 0 };
  }

  await likesCollection.insertOne({ userId, commentId, createdAt: new Date() });

  await commentsCollection.updateOne({ _id: commentId }, { $inc: { likes: 1 } });

  const updatedComment = await commentsCollection.findOne({ _id: commentId });

  return { liked: true, alreadyExists: false, likes: updatedComment?.likes ?? 0 };
}

export async function removeReelCommentLike(userId, commentId) {
  const likesCollection = await getReelCommentLikesCollection();
  const commentsCollection = await getReelCommentsCollection();

  const result = await likesCollection.deleteOne({ userId, commentId });

  if (result.deletedCount > 0) {
    await commentsCollection.updateOne({ _id: commentId }, { $inc: { likes: -1 } });
  }

  const updatedComment = await commentsCollection.findOne({ _id: commentId });

  return { liked: false, deleted: result.deletedCount > 0, likes: updatedComment?.likes ?? 0 };
}

export async function isReelCommentLiked(userId, commentId) {
  const likesCollection = await getReelCommentLikesCollection();
  const commentsCollection = await getReelCommentsCollection();

  const existing = await likesCollection.findOne({ userId, commentId });
  const comment = await commentsCollection.findOne({ _id: commentId });

  return { liked: !!existing, likes: comment?.likes ?? 0 };
}
