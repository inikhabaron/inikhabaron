import { getUserFromToken } from '@/lib/auth/admin/token';
import { canModerateComments } from '@/lib/auth/permissions';
import { success, failure } from '@/lib/api/response';
import { logApiError } from '@/lib/api/errors';
import { getCommentModerationStats } from '@/lib/services/comments/commentModerationService';

// Reads the admin token off the request, so it can never be prerendered.
export const dynamic = 'force-dynamic';

// Counts only — no comment rows. The admin dashboard shows the review-queue
// cards (pending guest comments, guest comments over 24h) from this, without
// pulling a page of comments just to read the stats attached to it.
export async function GET(request) {
  try {
    const user = await getUserFromToken(request);

    if (!user) {
      return failure('Unauthorized', 401);
    }

    if (!canModerateComments(user)) {
      return failure('Forbidden', 403);
    }

    return success(
      await getCommentModerationStats(),
      'Comment stats fetched successfully'
    );
  } catch (error) {
    logApiError('GET /api/admin/comments/stats', error);

    return failure('Unable to fetch comment stats', 500);
  }
}
