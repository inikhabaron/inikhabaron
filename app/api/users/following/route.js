import { requireUser } from '@/lib/auth/user/requireUser';
import { success, failure } from '@/lib/api/response';
import { logApiError } from '@/lib/api/errors';
import { getFollowing } from '@/lib/services/follow/followService';

// Reads per-request state (headers/cookies/query), so it can never be
// prerendered. Declared explicitly: without this Next attempts a static render
// at build time, the attempt throws DYNAMIC_SERVER_USAGE, and the route's own
// catch block logs it as an application error — the build-log noise.
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const auth = await requireUser();

    if (!auth.success) {
      return auth.response;
    }

    const data = await getFollowing(auth.user.id);

    return success(data, 'Following list fetched successfully');
  } catch (error) {
    logApiError('GET /api/users/following', error);

    return failure('Unable to fetch following list', 500);
  }
}
