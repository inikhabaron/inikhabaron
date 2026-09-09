import { requireUser } from '@/lib/auth/user/requireUser';
import { success, failure } from '@/lib/api/response';
import { logApiError } from '@/lib/api/errors';
import { getCollection } from '@/lib/mongodb';
import { submitFeedback, isValidVote } from '@/lib/services/feedback/feedbackService';

const MAX_COMMENT_LENGTH = 1000;

/**
 * POST /api/news/[id]/feedback — submit or update "Was this article
 * helpful?" feedback. One vote per user per article; calling this again
 * updates the existing entry (e.g. adding a comment after voting, or
 * changing the vote) rather than creating a duplicate.
 *
 * Body: { vote: 'helpful' | 'not_helpful', comment?: string }
 */
export async function POST(request, { params }) {
  try {
    const auth = await requireUser();
    if (!auth.success) return auth.response;

    const { id: articleId } = await params;
    const { vote, comment } = await request.json().catch(() => ({}));

    if (!isValidVote(vote)) {
      return failure('vote must be "helpful" or "not_helpful"', 400);
    }
    if (comment !== undefined && (typeof comment !== 'string' || comment.length > MAX_COMMENT_LENGTH)) {
      return failure(`Comment must be a string of ${MAX_COMMENT_LENGTH} characters or fewer`, 400);
    }

    const newsCollection = await getCollection('news');
    const article = await newsCollection.findOne({ id: articleId }, { projection: { _id: 1 } });
    if (!article) return failure('Article not found', 404);

    const result = await submitFeedback(auth.user.id, articleId, {
      vote,
      comment: typeof comment === 'string' ? comment.trim() : undefined,
    });

    return success(result, 'Feedback submitted');
  } catch (error) {
    logApiError('POST /api/news/[id]/feedback', error);
    return failure('Unable to submit feedback', 500);
  }
}
