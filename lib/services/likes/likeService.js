import { getLikesCollection } from '@/lib/db/likes';

export async function addLike(userId, articleId) {
  const likes = await getLikesCollection();

  const existing = await likes.findOne({
    userId,
    articleId,
  });

  if (existing) {
    const count = await likes.countDocuments({
        articleId,
    });
    return {
      liked: true,
      alreadyExists: true,
      count,
    };
  }

  await likes.insertOne({
    userId,
    articleId,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const count = await likes.countDocuments({
    articleId,
  });

  return {
    liked: true,
    alreadyExists: false,
    count,
  };
}

export async function removeLike(userId, articleId) {
  const likes = await getLikesCollection();

  const result = await likes.deleteOne({
    userId,
    articleId,
  });

  const count = await likes.countDocuments({
    articleId,
  });

  return {
    liked: false,
    deleted: result.deletedCount > 0,
    count,
  };
}

export async function isLiked(userId, articleId) {
  const likes = await getLikesCollection();

  const like = await likes.findOne({
    userId,
    articleId,
  });

  const count = await likes.countDocuments({
    articleId,
  });

  return {
    liked: !!like,
    likedAt: like?.createdAt || null,
    count,
  };
}