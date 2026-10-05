import { getCommentsCollection } from '@/lib/db/comments';
import { getCollection } from '@/lib/mongodb';
import { COLLECTIONS } from '@/lib/constants/collections';
import { ObjectId } from 'mongodb';
import { isAutoModerationEnabled, } from '@/lib/services/settings/commentModerationService';

// Guest comments have userId: null, so null must never reach the users join
// ($in: [null] also matches user docs that lack an `id`).
function userIdsOf(comments) {
  return [
    ...new Set(
      comments.map((c) => c.userId).filter(Boolean)
    ),
  ];
}

// The sender hashes under `guest` are abuse-limiting fingerprints — they stay
// server-side; the public sees only the display name. Moderation internals
// (who reviewed/deleted it, when, and the full action history with moderator
// ids and names) are for the admin API only. Comments written before `source`
// existed are all authenticated, so a missing value reads as that.
function toPublicComment(comment, userMap) {
  const {
    guest,
    moderationHistory,
    reviewedAt,
    reviewedBy,
    approveAt,
    deletedBy,
    deletedByName,
    ...rest
  } = comment;
  const source = comment.source ?? 'authenticated';

  return {
    ...rest,
    source,
    user: userMap.get(comment.userId) ?? null,
    ...(source === 'guest'
      ? { guest: { name: guest?.name || 'Guest' } }
      : {}),
  };
}

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

    const userIds = userIdsOf(comments);

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

    const items = comments.map((comment) =>
        toPublicComment(comment, userMap)
    );

    return {
        items,
        total,
        page,
        limit,
        hasNext: skip + items.length < total,
    };
}

// A guest comment (no login) is stored in the same collection with
// userId: null — explicitly null, never omitted, so `undefined === undefined`
// can't make it look owned by an anonymous viewer — and source: 'guest'.
//
// Guest comments are published immediately (status 'approved'), independent of
// the global moderation mode; they've already passed the pre-publication
// filters in guestCommentGuard.js. They stay "unreviewed" (reviewedAt: null)
// until an editor acts on them, which is what the admin 24h review queue and
// "Over 24h" warning are built on.
function sourceFields(guest) {
    if (!guest) {
        return { source: 'authenticated' };
    }

    const now = new Date();

    return {
        source: 'guest',
        guest: {
            name: guest.name,
            ipHash: guest.ipHash,
            deviceHash: guest.deviceHash ?? null,
            fingerprintHash: guest.fingerprintHash,
            contentKey: guest.contentKey,
        },
        reviewedAt: null,
        reviewedBy: null,
        moderationHistory: [
            {
                action: 'published',
                by: 'system',
                byName: 'Guest posting',
                at: now,
                reason: 'Published immediately after automated checks',
            },
        ],
    };
}

function statusFor(guest) {
    return guest ? 'approved' : 'pending';
}

function approveAtFor(moderation, guest) {
    if (guest || !moderation.enabled) {
        return null;
    }

    return new Date(
        Date.now() +
        moderation.delaySeconds * 1000
    );
}

export async function addComment(
    userId,
    articleId,
    content,
    { guest = null } = {}
) {
    const comments =
        await getCommentsCollection();

    const moderation =
        await isAutoModerationEnabled();

    const comment = {
        articleId,

        userId: guest ? null : userId,

        ...sourceFields(guest),

        parentCommentId: null,

        content: content.trim(),

        status: statusFor(guest),

        approveAt: approveAtFor(moderation, guest),

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

        status: comment.status,
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
  content,
  { guest = null } = {}
) {
  const comments = await getCommentsCollection();

  const moderation = await isAutoModerationEnabled();

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

  // A guest reply goes live immediately, so it may only attach to a comment
  // that is itself publicly visible — never a hidden/rejected/pending one.
  if (guest && parent.status !== 'approved') {
    return {
      success: false,
      reason: 'NOT_FOUND',
    };
  }

  const reply = {
    articleId: parent.articleId,

    userId: guest ? null : userId,

    ...sourceFields(guest),

    parentCommentId: parent._id,

    content: content.trim(),

    status: statusFor(guest),

    approveAt: approveAtFor(moderation, guest),

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

  // Authenticated replies are counted when a moderator/auto-moderation
  // approves them. A guest reply is already visible, so it counts now (and
  // commentModerationService keeps the count right if it's later removed).
  if (guest) {
    await comments.updateOne(
      { _id: parent._id },
      { $inc: { replyCount: 1 } }
    );
  }

  return {
    success: true,
    id: result.insertedId,
    status: reply.status,
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

  const userIds = userIdsOf(replies);

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

  const items = replies.map((reply) =>
    toPublicComment(reply, userMap)
  );

  return {
    items,
    total,
    page,
    limit,
    hasNext:
      skip + items.length < total,
  };
}
