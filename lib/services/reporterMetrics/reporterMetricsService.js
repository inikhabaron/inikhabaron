import { getCollection } from '@/lib/mongodb';
import { COLLECTIONS } from '@/lib/constants/collections';
import { getBookmarksCollection } from '@/lib/db/bookmarks';
import { getLikesCollection } from '@/lib/db/likes';
import { getCommentsCollection } from '@/lib/db/comments';

const USER_PROJECTION = { _id: 0, id: 1, name: 1, avatar: 1, role: 1, bio: 1 };

function sumSharesExpr() {
  return {
    $add: [
      { $ifNull: ['$shares.whatsapp', 0] },
      { $ifNull: ['$shares.twitter', 0] },
      { $ifNull: ['$shares.facebook', 0] },
    ],
  };
}

function articleShares(article) {
  return (article.shares?.whatsapp || 0) + (article.shares?.twitter || 0) + (article.shares?.facebook || 0);
}

async function countByArticleId(collection, articleIds, extraMatch = {}) {
  if (!articleIds.length) return new Map();
  const rows = await collection
    .aggregate([
      { $match: { articleId: { $in: articleIds }, ...extraMatch } },
      { $group: { _id: '$articleId', count: { $sum: 1 } } },
    ])
    .toArray();
  return new Map(rows.map((row) => [row._id, row.count]));
}

function sumForArticleIds(countMap, articleIds) {
  return articleIds.reduce((total, id) => total + (countMap.get(id) || 0), 0);
}

export async function getReporterMetricsList() {
  const newsCollection = await getCollection(COLLECTIONS.NEWS);

  const perAuthor = await newsCollection
    .aggregate([
      { $match: { status: 'published', authorId: { $ne: null } } },
      {
        $group: {
          _id: '$authorId',
          articlesPublished: { $sum: 1 },
          views: { $sum: { $ifNull: ['$views', 0] } },
          shares: { $sum: sumSharesExpr() },
          articleIds: { $push: '$id' },
        },
      },
    ])
    .toArray();

  if (!perAuthor.length) return [];

  const authorIds = perAuthor.map((a) => a._id);
  const allArticleIds = perAuthor.flatMap((a) => a.articleIds);

  const usersCollection = await getCollection(COLLECTIONS.USERS);
  const [authors, commentsCollection, bookmarksCollection, likesCollection] = await Promise.all([
    usersCollection.find({ id: { $in: authorIds } }, { projection: USER_PROJECTION }).toArray(),
    getCommentsCollection(),
    getBookmarksCollection(),
    getLikesCollection(),
  ]);

  const [commentCounts, bookmarkCounts, likeCounts] = await Promise.all([
    countByArticleId(commentsCollection, allArticleIds, { status: 'approved', isDeleted: false }),
    countByArticleId(bookmarksCollection, allArticleIds),
    countByArticleId(likesCollection, allArticleIds),
  ]);

  const authorsById = new Map(authors.map((author) => [author.id, author]));

  return perAuthor
    .map((a) => {
      const author = authorsById.get(a._id);
      return {
        id: a._id,
        name: author?.name,
        avatar: author?.avatar,
        role: author?.role,
        exists: !!author,
        articlesPublished: a.articlesPublished,
        views: a.views,
        shares: a.shares,
        comments: sumForArticleIds(commentCounts, a.articleIds),
        bookmarks: sumForArticleIds(bookmarkCounts, a.articleIds),
        likes: sumForArticleIds(likeCounts, a.articleIds),
      };
    })
    .sort((x, y) => y.views - x.views);
}

export async function getReporterMetricsById(reporterId) {
  const usersCollection = await getCollection(COLLECTIONS.USERS);
  const reporter = await usersCollection.findOne({ id: reporterId }, { projection: USER_PROJECTION });

  if (!reporter) return null;

  const newsCollection = await getCollection(COLLECTIONS.NEWS);
  const articles = await newsCollection
    .find({ authorId: reporterId, status: 'published' })
    .sort({ publishedAt: -1 })
    .toArray();

  const articleIds = articles.map((article) => article.id);

  const [commentsCollection, bookmarksCollection, likesCollection] = await Promise.all([
    getCommentsCollection(),
    getBookmarksCollection(),
    getLikesCollection(),
  ]);

  const [commentCounts, bookmarkCounts, likeCounts] = await Promise.all([
    countByArticleId(commentsCollection, articleIds, { status: 'approved', isDeleted: false }),
    countByArticleId(bookmarksCollection, articleIds),
    countByArticleId(likesCollection, articleIds),
  ]);

  const totals = { articlesPublished: articles.length, views: 0, shares: 0, comments: 0, bookmarks: 0, likes: 0 };

  const articleBreakdown = articles.map((article) => {
    const views = article.views || 0;
    const shares = articleShares(article);
    const comments = commentCounts.get(article.id) || 0;
    const bookmarks = bookmarkCounts.get(article.id) || 0;
    const likes = likeCounts.get(article.id) || 0;

    totals.views += views;
    totals.shares += shares;
    totals.comments += comments;
    totals.bookmarks += bookmarks;
    totals.likes += likes;

    return {
      id: article.id,
      title: article.title,
      category: article.category,
      publishedAt: article.publishedAt,
      views,
      shares,
      comments,
      bookmarks,
      likes,
    };
  });

  return { reporter, totals, articles: articleBreakdown };
}
