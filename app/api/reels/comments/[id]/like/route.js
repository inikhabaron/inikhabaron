import { ObjectId } from 'mongodb';
import { requireUser } from '@/lib/auth/user/requireUser';
import { success, failure } from '@/lib/api/response';
import { logApiError } from '@/lib/api/errors';
import { addReelCommentLike, removeReelCommentLike, isReelCommentLiked } from '@/lib/services/reels/reelCommentLikeService';
import { getReelCommentsCollection } from '@/lib/db/reelComments';

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

    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return failure('Invalid comment id', 400);
    }

    const comments = await getReelCommentsCollection();
    const comment = await comments.findOne({ _id: new ObjectId(id), isDeleted: false });
    if (!comment) {
      return failure('Comment not found', 404, { code: 'COMMENT_NOT_FOUND' });
    }

    const result = await addReelCommentLike(auth.user.id, new ObjectId(id));

    return success(result, result.alreadyExists ? 'Comment already liked' : 'Comment liked successfully');
  } catch (error) {
    logApiError('POST /api/reels/comments/[id]/like', error);
    return failure('Unable to like comment', 500);
  }
}

export async function DELETE(request, { params }) {
  try {
    const auth = await requireUser();
    if (!auth.success) {
      return auth.response;
    }

    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return failure('Invalid comment id', 400);
    }

    const result = await removeReelCommentLike(auth.user.id, new ObjectId(id));

    return success(result, result.deleted ? 'Comment unliked successfully' : 'Comment like not found');
  } catch (error) {
    logApiError('DELETE /api/reels/comments/[id]/like', error);
    return failure('Unable to remove comment like', 500);
  }
}

export async function GET(request, { params }) {
  try {
    const auth = await requireUser();
    if (!auth.success) {
      return auth.response;
    }

    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return failure('Invalid comment id', 400);
    }

    const comments = await getReelCommentsCollection();
    const comment = await comments.findOne({ _id: new ObjectId(id), isDeleted: false });
    if (!comment) {
      return failure('Comment not found', 404, { code: 'COMMENT_NOT_FOUND' });
    }

    const result = await isReelCommentLiked(auth.user.id, new ObjectId(id));

    return success({ ...result, likes: comment.likes ?? 0 }, 'Comment like status fetched successfully');
  } catch (error) {
    logApiError('GET /api/reels/comments/[id]/like', error);
    return failure('Unable to fetch comment like status', 500);
  }
}
