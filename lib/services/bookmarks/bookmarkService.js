import { getBookmarksCollection } from '@/lib/db/bookmarks';
import { getCollection } from '@/lib/mongodb';
import { COLLECTIONS } from '@/lib/constants/collections';

export async function addBookmark(userId, articleId) {
  const bookmarks = await getBookmarksCollection();

  const existing = await bookmarks.findOne({
    userId,
    articleId,
  });

  if (existing) {
    return {
      bookmarked: true,
      alreadyExists: true,
    };
  }

  const bookmark = {
    userId,
    articleId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await bookmarks.insertOne(bookmark);

  return {
    bookmarked: true,
    alreadyExists: false,
  };
}

export async function removeBookmark(userId, articleId) {
  const bookmarks = await getBookmarksCollection();

  const result = await bookmarks.deleteOne({
    userId,
    articleId,
  });

  return {
    bookmarked: false,
    deleted: result.deletedCount > 0,
  };
}

export async function getBookmarks(userId) {
  const bookmarksCollection = await getBookmarksCollection();

  const newsCollection = await getCollection(COLLECTIONS.NEWS);

  const bookmarks = await bookmarksCollection
    .find({ userId })
    .sort({ createdAt: -1 })
    .toArray();

  if (!bookmarks.length) {
    return {
      items: [],
      total: 0,
    };
  }

  const articleIds = bookmarks.map((bookmark) => bookmark.articleId);

  const articles = await newsCollection
    .find({
      id: { $in: articleIds },
    })
    .toArray();

  const bookmarkMap = new Map(
    bookmarks.map((bookmark) => [
      bookmark.articleId,
      bookmark.createdAt,
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
        bookmarkedAt: bookmarkMap.get(articleId),
      };
    })
    .filter(Boolean);

  return {
    items: orderedArticles,
    total: orderedArticles.length,
  };
}

export async function isBookmarked(userId, articleId) {
  const bookmarks = await getBookmarksCollection();

  const bookmark = await bookmarks.findOne({
    userId,
    articleId,
  });

  return {
    bookmarked: !!bookmark,
    bookmarkedAt: bookmark?.createdAt || null,
  };
}

// One query for "which of this user's articles are bookmarked" instead of
// N calls to isBookmarked() — used by pages that render many BookmarkButtons
// at once (home feed, category pages) so bookmark status is fetched once per
// page load, not once per card.
export async function getBookmarkedArticleIds(userId) {
  const bookmarks = await getBookmarksCollection();

  const docs = await bookmarks
    .find({ userId })
    .project({ articleId: 1, _id: 0 })
    .toArray();

  return docs.map((doc) => doc.articleId);
}