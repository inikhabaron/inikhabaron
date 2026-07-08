import { getCommentLikesCollection } from '@/lib/db/commentLikes';
import { getCommentsCollection } from '@/lib/db/comments';

export async function addCommentLike(
  userId,
  commentId
) {
  const likesCollection =
    await getCommentLikesCollection();

  const commentsCollection =
    await getCommentsCollection();

  const existing = await likesCollection.findOne({
    userId,
    commentId,
  });

  if (existing) {
    const comment = await commentsCollection.findOne({
      _id: commentId,
    });

    return {
      liked: true,
      alreadyExists: true,
      likes: comment?.likes ?? 0,
    };
  }

  await likesCollection.insertOne({
    userId,
    commentId,
    createdAt: new Date(),
  });

  await commentsCollection.updateOne(
    {
      _id: commentId,
    },
    {
      $inc: {
        likes: 1,
      },
    }
  );

  const updatedComment =
    await commentsCollection.findOne({
      _id: commentId,
    });

  return {
    liked: true,
    alreadyExists: false,
    likes: updatedComment?.likes ?? 0,
  };
}

export async function removeCommentLike(
  userId,
  commentId
) {
  const likesCollection =
    await getCommentLikesCollection();

  const commentsCollection =
    await getCommentsCollection();

  const result = await likesCollection.deleteOne({
    userId,
    commentId,
  });

  if (result.deletedCount > 0) {
    await commentsCollection.updateOne(
      {
        _id: commentId,
      },
      {
        $inc: {
          likes: -1,
        },
      }
    );
  }

  const updatedComment =
    await commentsCollection.findOne({
      _id: commentId,
    });

  return {
    liked: false,
    deleted: result.deletedCount > 0,
    likes: updatedComment?.likes ?? 0,
  };
}

export async function isCommentLiked(
  userId,
  commentId
) {
  const likesCollection =
    await getCommentLikesCollection();

  const commentsCollection =
    await getCommentsCollection();

  const existing = await likesCollection.findOne({
    userId,
    commentId,
  });

  const comment =
    await commentsCollection.findOne({
      _id: commentId,
    });

  return {
    liked: !!existing,
    likes: comment?.likes ?? 0,
  };
}