import { getUserFromToken } from '@/lib/auth/admin/token';
import {  canModerateComments } from '@/lib/auth/permissions';
import { success, failure, } from '@/lib/api/response';
import { logApiError, } from '@/lib/api/errors';
import { getCommentsForModeration, } from '@/lib/services/comments/commentModerationService';

// Reads per-request state (headers/cookies/query), so it can never be
// prerendered. Declared explicitly: without this Next attempts a static render
// at build time, the attempt throws DYNAMIC_SERVER_USAGE, and the route's own
// catch block logs it as an application error — the build-log noise.
export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const user = await getUserFromToken(request);

    if (!user) {
      return failure(
        'Unauthorized',
        401
      );
    }

    if (!canModerateComments(user)) {
      return failure(
        'Forbidden',
        403
      );
    }

    const { searchParams } = new URL(request.url);

    const result =
      await getCommentsForModeration({
        status:
          searchParams.get('status'),

        articleId:
          searchParams.get('articleId'),

        userId:
          searchParams.get('userId'),

        reported:
          searchParams.get('reported') ===
          'true',

        // 'guest' | 'authenticated' — anything else means both.
        source:
          searchParams.get('source'),

        // 'unreviewed' — nobody on the editorial team has acted on it yet
        // (see lib/comments/reviewSla.js).
        review:
          searchParams.get('review'),

        // Unreviewed and older than the 24h review window.
        overdue:
          searchParams.get('overdue') ===
          'true',

        // The Deleted view: only soft-deleted comments (every other view
        // excludes them).
        deleted:
          searchParams.get('deleted') ===
          'true',

        // Only comments submitted within the last N hours (e.g. "newest guest
        // comments"). Ignored unless a positive number.
        newerThanHours:
          Number(
            searchParams.get('newerThanHours')
          ) || undefined,

        // 'oldest_unreviewed' | 'newest' (default)
        sort:
          searchParams.get('sort'),

        page: Math.max(
          1,
          Number(
            searchParams.get('page')
          ) || 1
        ),

        limit: Math.min(
          100,
          Number(
            searchParams.get('limit')
          ) || 20
        ),
      });

    return success(
      result,
      'Comments fetched successfully'
    );
  } catch (error) {
    console.error(error);
    logApiError(
      'GET /api/admin/comments',
      error
    );

    return failure(
      'Unable to fetch comments',
      500
    );
  }
}