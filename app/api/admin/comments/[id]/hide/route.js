import { ObjectId } from 'mongodb';
import { getUserFromToken } from '@/lib/auth/admin/token';
import { canModerateComments, } from '@/lib/auth/permissions';
import { success, failure, } from '@/lib/api/response';
import { logApiError, } from '@/lib/api/errors';
import { hideComment, } from '@/lib/services/comments/commentModerationService';

export async function PATCH(request, { params }) {
  try {
    const user = await getUserFromToken(request);

    if (!user) {
      return failure('Unauthorized', 401);
    }

    if (!canModerateComments(user)) {
      return failure('Forbidden', 403);
    }

    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return failure(
        'Invalid comment id',
        400
      );
    }

    const body =
      await request.json().catch(
        () => ({})
      );

    const result =
      await hideComment(
        new ObjectId(id),
        user,
        body.reason || ''
      );

    if (!result.success) {
      return failure(
        'Comment not found',
        404
      );
    }

    return success(
      result,
      'Comment hidden successfully'
    );
  } catch (error) {
    logApiError(
      'PATCH /api/admin/comments/[id]/hide',
      error
    );

    return failure(
      'Unable to hide comment',
      500
    );
  }
}