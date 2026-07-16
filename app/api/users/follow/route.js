import { requireUser } from '@/lib/auth/user/requireUser';
import { success, failure } from '@/lib/api/response';
import { logApiError } from '@/lib/api/errors';
import { follow, unfollow, isValidFollowType } from '@/lib/services/follow/followService';

export async function POST(request) {
  try {
    const auth = await requireUser();

    if (!auth.success) {
      return auth.response;
    }

    const { type, id } = await request.json().catch(() => ({}));

    if (!type || !id) {
      return failure('type and id are required', 400);
    }

    if (!isValidFollowType(type)) {
      return failure('Invalid follow type', 400);
    }

    const result = await follow(auth.user.id, type, String(id));

    return success(result, 'Followed successfully');
  } catch (error) {
    logApiError('POST /api/users/follow', error);

    return failure('Unable to follow', 500);
  }
}

export async function DELETE(request) {
  try {
    const auth = await requireUser();

    if (!auth.success) {
      return auth.response;
    }

    const { type, id } = await request.json().catch(() => ({}));

    if (!type || !id) {
      return failure('type and id are required', 400);
    }

    if (!isValidFollowType(type)) {
      return failure('Invalid follow type', 400);
    }

    const result = await unfollow(auth.user.id, type, String(id));

    return success(result, 'Unfollowed successfully');
  } catch (error) {
    logApiError('DELETE /api/users/follow', error);

    return failure('Unable to unfollow', 500);
  }
}
