import { ObjectId } from 'mongodb';
import { getUserFromToken } from '@/lib/auth/admin/token';
import { canModerateComments, } from '@/lib/auth/permissions';
import { success, failure, } from '@/lib/api/response';
import { logApiError, } from '@/lib/api/errors';
import {
  deleteCommentAdmin,
  deleteCommentPermanently,
} from '@/lib/services/comments/commentModerationService';

// DELETE is a soft delete: the comment leaves the site and the working
// queues, but is kept and can be restored (PATCH .../restore).
//
// DELETE ?permanent=true removes it for good. That is admin-only, and only for
// a comment that is already in the Deleted view — nothing is destroyed in one
// click from a live list.
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

    const permanent =
      new URL(request.url).searchParams.get('permanent') === 'true';

    if (permanent) {
      if (user.role !== 'admin') {
        return failure(
          'Only an admin can permanently delete a comment',
          403
        );
      }

      const purged =
        await deleteCommentPermanently(
          new ObjectId(id)
        );

      if (!purged.success) {
        return failure(
          'Only a comment in the Deleted view can be permanently deleted',
          409
        );
      }

      return success(
        purged,
        'Comment permanently deleted'
      );
    }

    const body =
      await request.json().catch(
        () => ({})
      );

    const result =
      await deleteCommentAdmin(
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
