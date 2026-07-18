import { getLikesCollection } from '@/lib/db/likes';
import { getCollection } from '@/lib/mongodb';
import { COLLECTIONS } from '@/lib/constants/collections';

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

export async function getLikes(userId) {
  const likes = await getLikesCollection();

  const newsCollection = await getCollection(COLLECTIONS.NEWS);

  const likeDocs = await likes
    .find({ userId })
    .sort({ createdAt: -1 })
    .toArray();

  if (!likeDocs.length) {
    return {
      items: [],
      total: 0,
    };
  }

  const articleIds = likeDocs.map((like) => like.articleId);

  const articles = await newsCollection
    .find({
      id: { $in: articleIds },
    })
    .toArray();

  const likeMap = new Map(
    likeDocs.map((like) => [
      like.articleId,
      like.createdAt,
    ])
  );

  const articleMap = new Map(
    articles.map((article) => [
      article.id,
      article,
    ])
  );

  const orderedArticles = articleIds
    .map((articleId) => {
      const article = articleMap.get(articleId);

      if (!article) return null;

      return {
        ...article,
        likedAt: likeMap.get(articleId),
      };
    })
    .filter(Boolean);

  return {
    items: orderedArticles,
    total: orderedArticles.length,
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