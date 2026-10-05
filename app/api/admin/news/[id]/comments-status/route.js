import { getUserFromToken } from '@/lib/auth/admin/token';
import { canModerateComments, } from '@/lib/auth/permissions';
import { success, failure, } from '@/lib/api/response';
import { logApiError, } from '@/lib/api/errors';
import { setArticleCommentsClosed, } from '@/lib/services/comments/articleCommentsService';

// Reads the admin token off the request, so it can never be prerendered.
export const dynamic = 'force-dynamic';

// Close or reopen the comment thread on one article: { closed: boolean }.
// Same audience as comment moderation itself (admin / editor / reporter), with
// the service limiting a reporter to their own story.
export async function PATCH(request, { params }) {
  try {
    const user = await getUserFromToken(request);

    if (!user) {
      return failure('Unauthorized', 401);
    }

    if (!canModerateComments(user)) {
      return failure('Forbidden', 403);
    }

    const { id } = await params;

    const body = await request.json().catch(() => ({}));

    if (typeof body.closed !== 'boolean') {
      return failure('closed must be true or false', 400);
    }

    const result = await setArticleCommentsClosed(id, body.closed, user);

    if (!result.success) {
      return result.reason === 'FORBIDDEN'
        ? failure('Forbidden', 403)
        : failure('Article not found', 404);
    }

    return success(
      result,
      body.closed ? 'Comments closed for this article' : 'Comments reopened for this article'
    );
  } catch (error) {
    logApiError('PATCH /api/admin/news/[id]/comments-status', error);

    return failure('Unable to update comment settings', 500);
  }
}
