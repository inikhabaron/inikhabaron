import { requireUser } from '@/lib/auth/user/requireUser';
import { getReelsCollection } from '@/lib/db/reels';
import { success, failure } from '@/lib/api/response';
import { logApiError } from '@/lib/api/errors';
import { getReelComments, addReelComment } from '@/lib/services/reels/reelCommentService';
import { autoApprovePendingReelComments } from '@/lib/services/reels/autoApproveReelComments';

// Reads per-request state (headers/cookies/query), so it can never be
// prerendered. Declared explicitly: without this Next attempts a static render
// at build time, the attempt throws DYNAMIC_SERVER_USAGE, and the route's own
// catch block logs it as an application error — the build-log noise.
export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    await autoApprovePendingReelComments();

    const { id: reelId } = await params;

    const reels = await getReelsCollection();
    const reel = await reels.findOne({ id: reelId });
    if (!reel) {
      return failure('Reel not found', 404, { code: 'REEL_NOT_FOUND' });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const limit = Math.min(50, Number(searchParams.get('limit')) || 20);

    const result = await getReelComments(reelId, page, limit);

    return success(result, 'Comments fetched successfully');
  } catch (error) {
    logApiError('GET /api/reels/[id]/comments', error);
    return failure('Unable to fetch comments', 500);
  }
}

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

    const body = await request.json();
    const content = body.content?.trim();

    if (!content) {
      return failure('Comment content is required', 400);
    }
    if (content.length > 1000) {
      return failure('Comment cannot exceed 1000 characters', 400);
    }

    const result = await addReelComment(auth.user.id, reelId, content);

    return success(result, 'Comment submitted for review');
  } catch (error) {
    logApiError('POST /api/reels/[id]/comments', error);
    return failure('Unable to submit comment', 500);
  }
}
