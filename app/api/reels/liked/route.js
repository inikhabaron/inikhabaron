import { requireUser } from '@/lib/auth/user/requireUser';
import { success, failure } from '@/lib/api/response';
import { logApiError } from '@/lib/api/errors';
import { getReelLikes } from '@/lib/services/reels/reelLikeService';

export async function GET() {
  try {
    const auth = await requireUser();
    if (!auth.success) {
      return auth.response;
    }

    const result = await getReelLikes(auth.user.id);

    return success(result, 'Liked reels fetched successfully');
  } catch (error) {
    logApiError('GET /api/reels/liked', error);
    return failure('Unable to fetch liked reels', 500);
  }
}
