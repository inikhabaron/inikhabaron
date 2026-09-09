import { getArticleFeedbackCollection } from '@/lib/db/articleFeedback';
import { getCollection } from '@/lib/mongodb';
import { COLLECTIONS } from '@/lib/constants/collections';

export const FEEDBACK_VOTES = ['helpful', 'not_helpful'];

export function isValidVote(vote) {
  return FEEDBACK_VOTES.includes(vote);
}

/**
 * Submit or update a user's feedback on an article. One entry per
 * {userId, articleId} (matching the unique index in lib/db/articleFeedback.js)
 * — a later vote/comment updates the existing document rather than creating
 * a duplicate, same upsert shape as Follow, not comments' append-only
 * moderation queue, since feedback isn't public content needing approval.
 */
export async function submitFeedback(userId, articleId, { vote, comment }) {
  const collection = await getArticleFeedbackCollection();
  const now = new Date();

  const set = { userId, articleId, vote, updatedAt: now };
  if (comment !== undefined) set.comment = comment;

  const result = await collection.findOneAndUpdate(
    { userId, articleId },
    { $set: set, $setOnInsert: { createdAt: now } },
    { upsert: true, returnDocument: 'after' },
  );

  const doc = result.value || result;
  return { vote: doc.vote, comment: doc.comment || '' };
}

/**
 * Admin dashboard list: one row per article with helpful/not-helpful/total
 * counts, newest activity first. Article titles are joined in from `news`
 * so the dashboard doesn't need a second round trip per row.
 */
export async function getFeedbackSummary({ page = 1, limit = 20 } = {}) {
  const collection = await getArticleFeedbackCollection();
  const skip = (page - 1) * limit;

  const groupStage = {
    $group: {
      _id: '$articleId',
      helpfulCount: { $sum: { $cond: [{ $eq: ['$vote', 'helpful'] }, 1, 0] } },
      notHelpfulCount: { $sum: { $cond: [{ $eq: ['$vote', 'not_helpful'] }, 1, 0] } },
      feedbackCount: { $sum: 1 },
      lastFeedbackAt: { $max: '$updatedAt' },
    },
  };

  const [rows, countRows] = await Promise.all([
    collection.aggregate([
      groupStage,
      { $sort: { lastFeedbackAt: -1 } },
      { $skip: skip },
      { $limit: limit },
    ]).toArray(),
    collection.aggregate([groupStage, { $count: 'total' }]).toArray(),
  ]);

  const total = countRows[0]?.total || 0;
  const articleIds = rows.map((r) => r._id);

  const newsCollection = await getCollection(COLLECTIONS.NEWS);
  const articles = articleIds.length
    ? await newsCollection
        .find({ id: { $in: articleIds } })
        .project({ _id: 0, id: 1, title: 1 })
        .toArray()
    : [];
  const articleMap = new Map(articles.map((a) => [a.id, a]));

  return {
    items: rows.map((r) => ({
      articleId: r._id,
      // A feedback row for a since-deleted article still shows up (raw fact,
      // same "exists" spirit as the Follow module's stale-entry handling) —
      // just without a resolvable title.
      articleTitle: articleMap.get(r._id)?.title || null,
      helpfulCount: r.helpfulCount,
      notHelpfulCount: r.notHelpfulCount,
      feedbackCount: r.feedbackCount,
    })),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
}

/** Admin detail view: individual feedback entries (with comments) for one article. */
export async function getFeedbackForArticle(articleId, { page = 1, limit = 20 } = {}) {
  const collection = await getArticleFeedbackCollection();
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    collection
      .find({ articleId })
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray(),
    collection.countDocuments({ articleId }),
  ]);

  return {
    items: items.map((doc) => ({
      userId: doc.userId,
      vote: doc.vote,
      comment: doc.comment || '',
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    })),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
}
