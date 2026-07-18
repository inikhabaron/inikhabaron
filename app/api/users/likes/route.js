import { requireUser } from '@/lib/auth/user/requireUser';

import { success, failure } from '@/lib/api/response';
import { logApiError } from '@/lib/api/errors';

import { getLikes } from '@/lib/services/likes/likeService';

export async function GET() {
  try {
    const auth = await requireUser();

    if (!auth.success) {
      return auth.response;
    }

    const result = await getLikes(auth.user.id);

    return success(
      result,
      'Likes fetched successfully'
    );
  } catch (error) {
    logApiError(
      'GET /api/users/likes',
      error
    );

    return failure(
      'Unable to fetch likes',
      500
    );
  }
}
