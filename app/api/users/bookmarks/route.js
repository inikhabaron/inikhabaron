import { requireUser } from '@/lib/auth/user/requireUser';

import { success, failure } from '@/lib/api/response';
import { logApiError } from '@/lib/api/errors';

import { getBookmarks } from '@/lib/services/bookmarks/bookmarkService';

export async function GET() {
  try {
    const auth = await requireUser();

    if (!auth.success) {
      return auth.response;
    }

    const result = await getBookmarks(auth.user.id);

    return success(
      result,
      'Bookmarks fetched successfully'
    );
  } catch (error) {
    logApiError(
      'GET /api/users/bookmarks',
      error
    );

    return failure(
      'Unable to fetch bookmarks',
      500
    );
  }
}