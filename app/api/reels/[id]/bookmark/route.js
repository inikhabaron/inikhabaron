import { requireUser } from '@/lib/auth/user/requireUser';
import { getReelsCollection } from '@/lib/db/reels';
import { success, failure } from '@/lib/api/response';
import { logApiError } from '@/lib/api/errors';
import { addReelBookmark, removeReelBookmark, isReelBookmarked } from '@/lib/services/reels/reelBookmarkService';

// Reads per-request state (headers/cookies/query), so it can never be
// prerendered. Declared explicitly: without this Next attempts a static render
// at build time, the attempt throws DYNAMIC_SERVER_USAGE, and the route's own
// catch block logs it as an application error — the build-log noise.
export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
  try {
    const auth = await requireUser();
    if (!auth.success) {
      return auth.response;
    }

    const { id: reelId } = await params;

    const reels = await getReelsCollection();
    const reel = await reels.findOne({ id: reelId });
    if (!reel) {
      return failure('Reel not found', 404, { code: 'REEL_NOT_FOUND' });
    }

    const result = await addReelBookmark(auth.user.id, reelId);

    return success(result, result.alreadyExists ? 'Reel already bookmarked' : 'Reel bookmarked successfully');
  } catch (error) {
    logApiError('POST /api/reels/[id]/bookmark', error);
    return failure('Unable to bookmark reel', 500);
  }
}

export async function DELETE(request, { params }) {
  try {
    const auth = await requireUser();
    if (!auth.success) {
      return auth.response;
    }

    const { id: reelId } = await params;
    const result = await removeReelBookmark(auth.user.id, reelId);

    return success(result, result.deleted ? 'Bookmark removed successfully' : 'Bookmark not found');
  } catch (error) {
    logApiError('DELETE /api/reels/[id]/bookmark', error);
    return failure('Unable to remove bookmark', 500);
  }
}

export async function GET(request, { params }) {
  try {
    const auth = await requireUser();
    if (!auth.success) {
      return auth.response;
    }

    const { id: reelId } = await params;

    const reels = await getReelsCollection();
    const reel = await reels.findOne({ id: reelId });
    if (!reel) {
      return failure('Reel not found', 404, { code: 'REEL_NOT_FOUND' });
    }

    const result = await isReelBookmarked(auth.user.id, reelId);

    return success(result, 'Bookmark status fetched successfully');
  } catch (error) {
    logApiError('GET /api/reels/[id]/bookmark', error);
    return failure('Unable to fetch bookmark status', 500);
  }
}
