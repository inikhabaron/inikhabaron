import { requireUser } from '@/lib/auth/user/requireUser';
import { success, failure } from '@/lib/api/response';
import { logApiError } from '@/lib/api/errors';
import { getReelBookmarks } from '@/lib/services/reels/reelBookmarkService';

export async function GET() {
  try {
    const auth = await requireUser();
    if (!auth.success) {
      return auth.response;
    }

    const result = await getReelBookmarks(auth.user.id);

    return success(result, 'Bookmarked reels fetched successfully');
  } catch (error) {
    logApiError('GET /api/reels/bookmarked', error);
    return failure('Unable to fetch bookmarked reels', 500);
  }
}
