import { ObjectId } from 'mongodb';

import { getCommentsCollection } from '@/lib/db/comments';
import { getCollection } from '@/lib/mongodb';
import { COLLECTIONS } from '@/lib/constants/collections';
import { REVIEW_SLA_MS } from '@/lib/comments/reviewSla';

// "Unreviewed" as a Mongo filter: waiting for approval, or a guest comment that
// went live automatically and no editor has acted on yet. Keep in sync with
// isUnreviewed() in lib/comments/reviewSla.js (`reviewedAt: null` also matches
// documents where the field is absent).
const UNREVIEWED_FILTER = {
  $or: [
    { status: 'pending' },
    { source: 'guest', status: 'approved', reviewedAt: null },
  ],
};

// Same rule as an aggregation expression, for the "oldest unreviewed first" sort.
const UNREVIEWED_EXPR = {
  $or: [
    { $eq: ['$status', 'pending'] },
    {
      $and: [
        { $eq: ['$source', 'guest'] },
        { $eq: ['$status', 'approved'] },
        { $eq: [{ $ifNull: ['$reviewedAt', null] }, null] },
      ],
    },
  ],
};

// Soft-deleted comments (see deleteCommentAdmin) are out of every working view
// and every count; they only show under the "Deleted" filter.
const ACTIVE = { isDeleted: { $ne: true } };

const unreviewedFilter = () => ({ $and: [ACTIVE, UNREVIEWED_FILTER] });

const overdueFilter = () => ({
  $and: [
    ACTIVE,
    UNREVIEWED_FILTER,
    { createdAt: { $lt: new Date(Date.now() - REVIEW_SLA_MS) } },
  ],
});

// Counts for the admin stat cards. One pass over the collection (not one
// count per card), and independent of the active filter/page so the cards stay
// true when the table is filtered.
export async function getCommentModerationStats() {
  const comments = await getCommentsCollection();

  const [result] = await comments
    .aggregate([
      {
        $facet: {
          byStatus: [
            { $match: ACTIVE },
            { $group: { _id: '$status', count: { $sum: 1 } } },
          ],
          reported: [
            { $match: { ...ACTIVE, reports: { $gt: 0 } } },
            { $count: 'count' },
          ],
          guest: [
            { $match: { ...ACTIVE, source: 'guest' } },
            { $count: 'count' },
          ],
          deleted: [
            { $match: { isDeleted: true } },
            { $count: 'count' },
          ],
          needsReview: [
            { $match: unreviewedFilter() },
            { $count: 'count' },
          ],
          guestUnreviewed: [
            { $match: { $and: [unreviewedFilter(), { source: 'guest' }] } },
            { $count: 'count' },
          ],
          guestOverdue: [
            { $match: { $and: [overdueFilter(), { source: 'guest' }] } },
            { $count: 'count' },
          ],
          overdue: [
            { $match: overdueFilter() },
            { $count: 'count' },
          ],
        },
      },
    ])
    .toArray();

  const byStatus = Object.fromEntries(
    result.byStatus.map((row) => [row._id, row.count])
  );

  return {
    pending: byStatus.pending || 0,
    approved: byStatus.approved || 0,
    hidden: byStatus.hidden || 0,
    rejected: byStatus.rejected || 0,
    reported: result.reported[0]?.count || 0,
    guest: result.guest[0]?.count || 0,
    deleted: result.deleted[0]?.count || 0,
    needsReview: result.needsReview[0]?.count || 0,
    guestUnreviewed: result.guestUnreviewed[0]?.count || 0,
    guestOverdue: result.guestOverdue[0]?.count || 0,
    overdue: result.overdue[0]?.count || 0,
  };
}

// Admins see a guest's chosen name and short sender references (first 8 chars
// of the salted IP / device hashes) — enough to spot one sender flooding the
// queue, not enough to identify anyone. The full hashes never leave the server.
function toModerationComment(comment, userMap, articleMap) {
  const { guest, ...rest } = comment;
  const source = comment.source ?? 'authenticated';

  return {
    ...rest,
    source,
    user: userMap.get(comment.userId) ?? null,
    article: articleMap.get(comment.articleId) ?? null,
    ...(source === 'guest'
      ? {
          guest: {
            name: guest?.name || 'Guest',
            ipRef: guest?.ipHash?.slice(0, 8) || null,
            deviceRef: guest?.deviceHash?.slice(0, 8) || null,
          },
        }
      : {}),
  };
}

export async function getCommentsForModeration({
  status,
  articleId,
  userId,
  reported,
  source,
  review,
  overdue,
  deleted,
  newerThanHours,
  sort,
  page = 1,
  limit = 20,
}) {
  const commentsCollection =
    await getCommentsCollection();

  const usersCollection =
    await getCollection(COLLECTIONS.USERS);

  const newsCollection =
    await getCollection(COLLECTIONS.NEWS);

  const conditions = [];

  // The "Deleted" view shows only soft-deleted comments; every other view
  // excludes them.
  conditions.push(deleted === true ? { isDeleted: true } : ACTIVE);

  if (status && status !== 'all') {
    conditions.push({ status });
  }

  if (articleId) {
    conditions.push({ articleId });
  }

  if (userId) {
    conditions.push({ userId });
  }

  if (reported === true) {
    conditions.push({ reports: { $gt: 0 } });
  }

  // Comments written before `source` existed are all authenticated, hence $ne.
  if (source === 'guest') {
    conditions.push({ source: 'guest' });
  } else if (source === 'authenticated') {
    conditions.push({ source: { $ne: 'guest' } });
  }

  if (review === 'unreviewed') {
    conditions.push(unreviewedFilter());
  }

  // Unreviewed AND past the review window.
  if (overdue === true) {
    conditions.push(overdueFilter());
  }

  if (Number.isFinite(newerThanHours) && newerThanHours > 0) {
    conditions.push({
      createdAt: { $gte: new Date(Date.now() - newerThanHours * 60 * 60 * 1000) },
    });
  }

  const query = conditions.length ? { $and: conditions } : {};

  const skip = (page - 1) * limit;

  const total =
    await commentsCollection.countDocuments(query);

  // 'oldest_unreviewed': everything still awaiting review first, oldest first
  // (the ones nearest the 24h window on top), then the already-reviewed
  // comments newest first. Anything else is plain newest-first.
  const comments =
    sort === 'oldest_unreviewed'
      ? await commentsCollection
          .aggregate([
            { $match: query },
            { $addFields: { _unreviewed: UNREVIEWED_EXPR } },
            {
              $addFields: {
                _order: {
                  $cond: [
                    '$_unreviewed',
                    { $toLong: '$createdAt' },
                    { $multiply: [-1, { $toLong: '$createdAt' }] },
                  ],
                },
              },
            },
            { $sort: { _unreviewed: -1, _order: 1 } },
            { $skip: skip },
            { $limit: limit },
            { $project: { _unreviewed: 0, _order: 0 } },
          ])
          .toArray()
      : await commentsCollection
          .find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .toArray();

  const stats = await getCommentModerationStats();

  if (!comments.length) {
    return {
      items: [],
      total,
      page,
      limit,
      stats,
    };
  }

  const userIds = [
    ...new Set(
      comments.map((c) => c.userId).filter(Boolean)
    ),
  ];

  const articleIds = [
    ...new Set(
      comments.map((c) => c.articleId)
    ),
  ];

  const [users, articles] =
    await Promise.all([
      usersCollection
        .find({
          id: {
            $in: userIds,
          },
        })
        .project({
          id: 1,
          name: 1,
          avatar: 1,
        })
        .toArray(),

      newsCollection
        .find({
          id: {
            $in: articleIds,
          },
        })
        .project({
          id: 1,
          title: 1,
          slug: 1,
          commentsClosed: 1,
        })
        .toArray(),
    ]);

  const userMap = new Map(
    users.map((u) => [u.id, u])
  );

  const articleMap = new Map(
    articles.map((a) => [a.id, a])
  );

  return {
    items: comments.map((comment) =>
      toModerationComment(comment, userMap, articleMap)
    ),
    total,
    page,
    limit,
    hasNext:
      skip + comments.length < total,
    stats,
  };
}

// How a moderation action changes the parent's replyCount.
//   Guest replies are counted the moment they're posted (they publish
//   immediately), so the count follows them in and out of the published state.
//   Authenticated replies keep the original behaviour: +1 when approved.
function replyCountDelta(comment, nowPublished) {
  if (!comment.parentCommentId) {
    return 0;
  }

  const wasPublished = comment.status === 'approved';

  if (comment.source === 'guest') {
    if (!wasPublished && nowPublished) return 1;
    if (wasPublished && !nowPublished) return -1;
    return 0;
  }

  return nowPublished ? 1 : 0;
}

async function adjustReplyCount(comments, parentCommentId, delta) {
  if (!delta) {
    return;
  }

  await comments.updateOne(
    // Never push a count below zero.
    delta < 0
      ? { _id: parentCommentId, replyCount: { $gt: 0 } }
      : { _id: parentCommentId },
    { $inc: { replyCount: delta } }
  );
}

async function moderateComment(
  commentId,
  status,
  moderator,
  reason = ''
) {
  const comments =
    await getCommentsCollection();

  const comment =
    await comments.findOne({
      _id: commentId,
    });

  if (!comment || comment.isDeleted) {
    return {
      success: false,
      reason: 'NOT_FOUND',
    };
  }

  const now = new Date();

  // Any editor action counts as a review: it takes the comment out of the
  // "unreviewed" queue (and off the Over-24h warning).
  const update = {
    status,
    updatedAt: now,
    reviewedAt: now,
    reviewedBy: moderator.id,
  };

  const keptPublished =
    comment.status === 'approved' && status === 'approved';

  const historyEntry = {
    action: status,
    by: moderator.id,
    byName: moderator.name,
    at: now,
    reason: reason || (keptPublished ? 'Reviewed - kept published' : ''),
  };

  await comments.updateOne(
    {
      _id: commentId,
    },
    {
      $set: update,
      $push: {
        moderationHistory: historyEntry,
      },
    }
  );

  await adjustReplyCount(
    comments,
    comment.parentCommentId,
    replyCountDelta(comment, status === 'approved')
  );

  return {
    success: true,
  };
}

export async function approveComment(
  commentId,
  moderator,
  reason
) {
  return moderateComment(
    commentId,
    'approved',
    moderator,
    reason
  );
}

export async function rejectComment(
  commentId,
  moderator,
  reason
) {
  return moderateComment(
    commentId,
    'rejected',
    moderator,
    reason
  );
}

export async function hideComment(
  commentId,
  moderator,
  reason
) {
  return moderateComment(
    commentId,
    'hidden',
    moderator,
    reason
  );
}

// "Delete" in the admin UI is a soft delete: the comment disappears from the
// public site and every working view, but the document — content, sender
// hashes, moderation history — is kept so it can be restored after a mistake
// or produced if a takedown is ever questioned. A reply that was live is
// taken out of the parent's replyCount (guest replies only, see
// replyCountDelta). Deleting counts as a review.
export async function deleteCommentAdmin(
  commentId,
  moderator,
  reason = ''
) {
  const comments =
    await getCommentsCollection();

  const comment =
    await comments.findOne({
      _id: commentId,
    });

  if (!comment || comment.isDeleted) {
    return {
      success: false,
      reason: 'NOT_FOUND',
    };
  }

  const now = new Date();

  await comments.updateOne(
    {
      _id: commentId,
    },
    {
      $set: {
        isDeleted: true,
        deletedAt: now,
        deletedBy: moderator.id,
        deletedByName: moderator.name,
        updatedAt: now,
        reviewedAt: comment.reviewedAt ?? now,
        reviewedBy: comment.reviewedBy ?? moderator.id,
      },
      $push: {
        moderationHistory: {
          action: 'deleted',
          by: moderator.id,
          byName: moderator.name,
          at: now,
          reason,
        },
      },
    }
  );

  await adjustReplyCount(
    comments,
    comment.parentCommentId,
    replyCountDelta(comment, false)
  );

  return {
    success: true,
  };
}

// Only comments an editor soft-deleted can come back. One the author deleted
// themselves had its text replaced with "[deleted]" at the time, so there is
// nothing to restore.
export async function restoreComment(
  commentId,
  moderator,
  reason = ''
) {
  const comments =
    await getCommentsCollection();

  const comment =
    await comments.findOne({
      _id: commentId,
    });

  if (!comment || !comment.isDeleted) {
    return {
      success: false,
      reason: 'NOT_FOUND',
    };
  }

  if (!comment.deletedBy) {
    return {
      success: false,
      reason: 'NOT_RESTORABLE',
    };
  }

  const now = new Date();

  await comments.updateOne(
    {
      _id: commentId,
    },
    {
      $set: {
        isDeleted: false,
        deletedAt: null,
        updatedAt: now,
      },
      $unset: {
        deletedBy: '',
        deletedByName: '',
      },
      $push: {
        moderationHistory: {
          action: 'restored',
          by: moderator.id,
          byName: moderator.name,
          at: now,
          reason,
        },
      },
    }
  );

  // A live guest reply is counted again now that it is visible.
  await adjustReplyCount(
    comments,
    comment.parentCommentId,
    comment.source === 'guest' && comment.status === 'approved' ? 1 : 0
  );

  return {
    success: true,
  };
}

// Irreversible. Only ever applied to a comment that is already in the Deleted
// view, so nothing is destroyed in a single click from a working list.
export async function deleteCommentPermanently(
  commentId
) {
  const comments =
    await getCommentsCollection();

  const result =
    await comments.deleteOne({
      _id: commentId,
      isDeleted: true,
    });

  return {
    success:
      result.deletedCount > 0,
  };
}
