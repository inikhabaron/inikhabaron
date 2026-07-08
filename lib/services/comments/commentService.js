import { getCommentsCollection } from '@/lib/db/comments';
import { getCollection } from '@/lib/mongodb';
import { COLLECTIONS } from '@/lib/constants/collections';
import { ObjectId } from 'mongodb';

export async function getComments(
  articleId,
  page = 1,
  limit = 20
) {
    const skip = (page - 1) * limit;

    const commentsCollection =
        await getCommentsCollection();

    const usersCollection =
        await getCollection(COLLECTIONS.USERS);

    const query = {
        articleId,
        status: 'approved',
        parentCommentId: null,
        isDeleted: false,
    };

    const total = await commentsCollection.countDocuments(query);

    const comments = await commentsCollection
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
            total: 0,
            page,
            limit,
            hasNext: false,
        };
    }

    const userIds = [
        ...new Set(
            comments.map((c) => c.userId)
        ),
    ];

    const users = await usersCollection
        .find({
            id: { $in: userIds },
        })
        .project({
            id: 1,
            name: 1,
            avatar: 1,
        })
        .toArray();

    const userMap = new Map(
        users.map((u) => [
            u.id,
            u,
        ])
    );

    const items = comments.map((comment) => ({
        ...comment,
        user: userMap.get(comment.userId) ?? null,
    }));

    return {
        items,
        total,
        page,
        limit,
        hasNext: skip + items.length < total,
    };
}

export async function addComment(
    userId,
    articleId,
    content
) {
    const comments =
        await getCommentsCollection();

    const comment = {
        articleId,

        userId,

        parentCommentId: null,

        content: content.trim(),

        status: 'pending',

        likes: 0,

        replyCount: 0,

        reports: 0,

        edited: false,

        isDeleted: false,

        deletedAt: null,

        createdAt: new Date(),

        updatedAt: new Date(),
    };

    const result =
        await comments.insertOne(comment);

    return {
        id: result.insertedId,

        status: 'pending',
    };
}

export async function updateComment(
  commentId,
  userId,
  content
) {
  const comments = await getCommentsCollection();

  const comment = await comments.findOne({
    _id: commentId,
  });

  if (!comment) {
    return {
      success: false,
      reason: 'NOT_FOUND',
    };
  }

  if (comment.userId !== userId) {
    return {
      success: false,
      reason: 'FORBIDDEN',
    };
  }

  if (comment.isDeleted) {
    return {
      success: false,
      reason: 'DELETED',
    };
  }

  await comments.updateOne(
    {
      _id: commentId,
    },
    {
      $set: {
        content: content.trim(),
        edited: true,
        updatedAt: new Date(),
      },
    }
  );

  return {
    success: true,
  };
}

export async function deleteComment(
  commentId,
  userId
) {
  const comments = await getCommentsCollection();

  const comment = await comments.findOne({
    _id: commentId,
  });

  if (!comment) {
    return {
      success: false,
      reason: 'NOT_FOUND',
    };
  }

  if (comment.userId !== userId) {
    return {
      success: false,
      reason: 'FORBIDDEN',
    };
  }

  if (comment.isDeleted) {
    return {
      success: false,
      reason: 'ALREADY_DELETED',
    };
  }

  await comments.updateOne(
    {
      _id: commentId,
    },
    {
      $set: {
        content: '[deleted]',
        isDeleted: true,
        deletedAt: new Date(),
        updatedAt: new Date(),
      },
    }
  );

  return {
    success: true,
    deleted: true,
  };
}

export async function addReply(
  userId,
  parentCommentId,
  content
) {
  const comments = await getCommentsCollection();

  const parent = await comments.findOne({
    _id: parentCommentId,
  });

  if (!parent) {
    return {
      success: false,
      reason: 'NOT_FOUND',
    };
  }

  if (parent.isDeleted) {
    return {
      success: false,
      reason: 'PARENT_DELETED',
    };
  }

  // Only one level of replies
  if (parent.parentCommentId !== null) {
    return {
      success: false,
      reason: 'NESTED_REPLY_NOT_ALLOWED',
    };
  }

  const reply = {
    articleId: parent.articleId,

    userId,

    parentCommentId: parent._id,

    content: content.trim(),

    status: 'pending',

    likes: 0,

    replyCount: 0,

    reports: 0,

    edited: false,

    isDeleted: false,

    deletedAt: null,

    createdAt: new Date(),

    updatedAt: new Date(),
  };

  const result = await comments.insertOne(reply);

  return {
    success: true,
    id: result.insertedId,
    status: 'pending',
  };
}

export async function getReplies(parentCommentId, page = 1, limit = 20) {
  const commentsCollection =
    await getCommentsCollection();

  const usersCollection =
    await getCollection(COLLECTIONS.USERS);

  const skip = (page - 1) * limit;

  const query = {
    parentCommentId,
    status: 'approved',
    isDeleted: false,
  };

   const total =
    await commentsCollection.countDocuments(query);

  const replies = await commentsCollection
    .find(query)
    .sort({
        createdAt: 1,
    })
    .skip(skip)
    .limit(limit)
    .toArray();

  if (!replies.length) {
    return {
      items: [],
      total: 0,
      page,
      limit,
      hasNext: false,
    };
  }

  const userIds = [
    ...new Set(
      replies.map((reply) => reply.userId)
    ),
  ];

  const users = await usersCollection
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
    .toArray();

  const userMap = new Map(
    users.map((user) => [
      user.id,
      user,
    ])
  );

  const items = replies.map((reply) => ({
    ...reply,
    user: userMap.get(reply.userId) ?? null,
  }));

  return {
    items,
    total,
    page,
    limit,
    hasNext:
      skip + items.length < total,
  };
}
