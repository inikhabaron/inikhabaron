import { requireUser } from '@/lib/auth/user/requireUser';

import { success, failure } from '@/lib/api/response';
import { logApiError } from '@/lib/api/errors';

import { getBookmarkedArticleIds } from '@/lib/services/bookmarks/bookmarkService';

/**
 * GET /api/users/bookmarks/ids
 *
 * Returns just the current user's bookmarked article ids (no article
 * bodies) so a page rendering many BookmarkButtons can fetch bookmark
 * status once and derive every button's state locally, instead of each
 * button independently calling GET /api/news/[id]/bookmark.
 */
export async function GET() {
  try {
    const auth = await requireUser();

    if (!auth.success) {
      return auth.response;
    }

    const articleIds = await getBookmarkedArticleIds(auth.user.id);

    return success(
      { articleIds },
      'Bookmarked article ids fetched successfully'
    );
  } catch (error) {
    logApiError(
      'GET /api/users/bookmarks/ids',
      error
    );

    return failure(
      'Unable to fetch bookmarked article ids',
      500
    );
  }
}
