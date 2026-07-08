import { ObjectId } from 'mongodb';
import { getUserFromToken } from '@/lib/auth/admin/token';
import { canModerateComments, } from '@/lib/auth/permissions';
import { success, failure, } from '@/lib/api/response';
import { logApiError, } from '@/lib/api/errors';
import { deleteCommentAdmin, } from '@/lib/services/comments/commentModerationService';

export async function DELETE(request, { params }) {
  try {
    const user = await getUserFromToken(request);

    if (!user) {
      return failure(
        'Unauthorized',
        401
      );
    }

    if (!canModerateComments(user)) {
      return failure(
        'Forbidden',
        403
      );
    }

    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return failure(
        'Invalid comment id',
        400
      );
    }

    const result =
      await deleteCommentAdmin(
        new ObjectId(id)
      );

    if (!result.success) {
      return failure(
        'Comment not found',
        404
      );
    }

    return success(
      result,
      'Comment deleted successfully'
    );
  } catch (error) {
    logApiError(
      'DELETE /api/admin/comments/[id]',
      error
    );

    return failure(
      'Unable to delete comment',
      500
    );
  }
}