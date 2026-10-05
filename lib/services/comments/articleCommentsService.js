import { getCollection } from '@/lib/mongodb';
import { getCommentsCollection } from '@/lib/db/comments';
import { COLLECTIONS } from '@/lib/constants/collections';

/**
 * Per-article "close comments" switch: `commentsClosed: true` on the article
 * stops *new* comments and replies (guest and logged-in alike) while leaving
 * everything already posted visible — moderators hide individual comments
 * separately. It exists for the stories where a thread would turn ugly faster
 * than the team can review it (communal incidents, court matters, elections).
 *
 * The flag is read live from the comments API rather than from the ISR-cached
 * article page, so closing a thread takes effect immediately.
 */

export async function setArticleCommentsClosed(articleId, closed, user) {
  const news = await getCollection(COLLECTIONS.NEWS);

  const article = await news.findOne(
    { id: articleId },
    { projection: { id: 1, authorId: 1 } }
  );

  if (!article) {
    return { success: false, reason: 'NOT_FOUND' };
  }

  // A reporter may only manage the thread on their own story.
  if (user.role === 'reporter' && article.authorId !== user.id) {
    return { success: false, reason: 'FORBIDDEN' };
  }

  const now = new Date();

  // Deliberately not touching `updatedAt`: that feeds the article's
  // modified-time in structured data and the sitemap, and a moderation switch
  // is not a content edit.
  await news.updateOne(
    { id: articleId },
    {
      $set: closed
        ? {
            commentsClosed: true,
            commentsClosedAt: now,
            commentsClosedBy: user.id,
          }
        : {
            commentsClosed: false,
            commentsReopenedAt: now,
            commentsReopenedBy: user.id,
          },
    }
  );

  return { success: true, closed };
}

/** For the reply route, which only knows the parent comment's id. */
export async function areCommentsClosedForComment(commentId) {
  const comments = await getCommentsCollection();

  const comment = await comments.findOne(
    { _id: commentId },
    { projection: { articleId: 1 } }
  );

  if (!comment) {
    return false;
  }

  const news = await getCollection(COLLECTIONS.NEWS);

  const article = await news.findOne(
    { id: comment.articleId },
    { projection: { commentsClosed: 1 } }
  );

  return article?.commentsClosed === true;
}

export const COMMENTS_CLOSED_MESSAGE = 'Comments are closed for this story.';
