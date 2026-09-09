import { requireUser } from '@/lib/auth/user/requireUser';
import { success, failure } from '@/lib/api/response';
import { logApiError } from '@/lib/api/errors';
import { getFollowedTopicsFeed } from '@/lib/services/follow/followService';

// Reads per-request state (cookie session), so it can never be prerendered.
export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const auth = await requireUser();
    if (!auth.success) return auth.response;

    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || 20;

    const data = await getFollowedTopicsFeed(auth.user.id, { page, limit });

    return success(data, 'Followed topics feed fetched successfully');
  } catch (error) {
    logApiError('GET /api/users/followed-topics', error);

    return failure('Unable to fetch followed topics feed', 500);
  }
}
