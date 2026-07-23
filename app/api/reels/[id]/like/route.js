import { requireUser } from '@/lib/auth/user/requireUser';
import { getReelsCollection } from '@/lib/db/reels';
import { success, failure } from '@/lib/api/response';
import { logApiError } from '@/lib/api/errors';
import { addReelLike, removeReelLike, isReelLiked } from '@/lib/services/reels/reelLikeService';

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

    const result = await addReelLike(auth.user.id, reelId);

    return success(result, result.alreadyExists ? 'Reel already liked' : 'Reel liked successfully');
  } catch (error) {
    logApiError('POST /api/reels/[id]/like', error);
    return failure('Unable to like reel', 500);
  }
}

export async function DELETE(request, { params }) {
  try {
    const auth = await requireUser();
    if (!auth.success) {
      return auth.response;
    }

    const { id: reelId } = await params;
    const result = await removeReelLike(auth.user.id, reelId);

    return success(result, result.deleted ? 'Reel unliked successfully' : 'Like not found');
  } catch (error) {
    logApiError('DELETE /api/reels/[id]/like', error);
    return failure('Unable to remove like', 500);
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

    const result = await isReelLiked(auth.user.id, reelId);

    return success(result, 'Like status fetched successfully');
  } catch (error) {
    logApiError('GET /api/reels/[id]/like', error);
    return failure('Unable to fetch like status', 500);
  }
}
