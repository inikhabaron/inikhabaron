import { ObjectId } from 'mongodb';

import { getCommentsCollection } from '@/lib/db/comments';
import { getCollection } from '@/lib/mongodb';
import { COLLECTIONS } from '@/lib/constants/collections';

export async function getCommentsForModeration({
  status,
  articleId,
  userId,
  reported,
  page = 1,
  limit = 20,
}) {
  const commentsCollection =
    await getCommentsCollection();

  const usersCollection =
    await getCollection(COLLECTIONS.USERS);

  const newsCollection =
    await getCollection(COLLECTIONS.NEWS);

  const query = {};

  if (status && status !== 'all') {
    query.status = status;
  }

  if (articleId) {
    query.articleId = articleId;
  }

  if (userId) {
    query.userId = userId;
  }

  if (reported === true) {
    query.reports = { $gt: 0 };
  }

  const skip = (page - 1) * limit;

  const total =
    await commentsCollection.countDocuments(query);

  const comments =
    await commentsCollection
      .find(query)
      .sort({
        createdAt: -1,
      })
      .skip(skip)
      .limit(limit)
      .toArray();

  if (!comments.length) {
    return {
      items: [],
      total,
      page,
      limit,
    };
  }

  const userIds = [
    ...new Set(
      comments.map((c) => c.userId)
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
    items: comments.map((comment) => ({
      ...comment,
      user: userMap.get(comment.userId) ?? null,
      article:
        articleMap.get(comment.articleId) ?? null,
    })),
    total,
    page,
    limit,
    hasNext:
      skip + comments.length < total,
  };
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

  if (!comment) {
    return {
      success: false,
      reason: 'NOT_FOUND',
    };
  }

  const update = {
    status,
    updatedAt: new Date(),
  };

  const historyEntry = {
    action: status,
    by: moderator.id,
    byName: moderator.name,
    at: new Date(),
    reason,
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

  // Only approved replies count
  if (
    status === 'approved' &&
    comment.parentCommentId
  ) {
    await comments.updateOne(
      {
        _id: comment.parentCommentId,
      },
      {
        $inc: {
          replyCount: 1,
        },
      }
    );
  }

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

export async function deleteCommentAdmin(
  commentId
) {
  const comments =
    await getCommentsCollection();

  const result =
    await comments.deleteOne({
      _id: commentId,
    });

  return {
    success:
      result.deletedCount > 0,
  };
}