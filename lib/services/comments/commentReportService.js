import { getCommentReportsCollection } from '@/lib/db/commentReports';
import { getCommentsCollection } from '@/lib/db/comments';

export const COMMENT_REPORT_REASONS = Object.freeze([
  'Spam',
  'Harassment',
  'Hate Speech',
  'Misinformation',
  'Offensive Content',
  'Copyright',
  'Other',
]);

export async function reportComment(
  userId,
  commentId,
  reason
) {
  const reportsCollection =
    await getCommentReportsCollection();

  const commentsCollection =
    await getCommentsCollection();

  const existing =
    await reportsCollection.findOne({
      userId,
      commentId,
    });

  if (existing) {
    const comment =
      await commentsCollection.findOne({
        _id: commentId,
      });

    return {
      reported: true,
      alreadyReported: true,
      reports: comment?.reports ?? 0,
    };
  }

  await reportsCollection.insertOne({
    userId,
    commentId,
    reason,
    createdAt: new Date(),
  });

  await commentsCollection.updateOne(
    {
      _id: commentId,
    },
    {
      $inc: {
        reports: 1,
      },
    }
  );

  const updatedComment =
    await commentsCollection.findOne({
      _id: commentId,
    });

  return {
    reported: true,
    alreadyReported: false,
    reports: updatedComment?.reports ?? 0,
  };
}

export async function hasReportedComment(
  userId,
  commentId
) {
  const reportsCollection =
    await getCommentReportsCollection();

  const commentsCollection =
    await getCommentsCollection();

  const existing =
    await reportsCollection.findOne({
      userId,
      commentId,
    });

  const comment =
    await commentsCollection.findOne({
      _id: commentId,
    });

  return {
    reported: !!existing,
    reports: comment?.reports ?? 0,
  };
}