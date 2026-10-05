import { ObjectId } from 'mongodb';
import { getUserFromToken } from '@/lib/auth/admin/token';
import { canModerateComments, } from '@/lib/auth/permissions';
import { success, failure, } from '@/lib/api/response';
import { logApiError, } from '@/lib/api/errors';
import { restoreComment, } from '@/lib/services/comments/commentModerationService';

// Undo a soft delete. The comment returns with the status it had when it was
// deleted (so a live comment goes live again).
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
      return failure('Invalid comment id', 400);
    }

    const body =
      await request.json().catch(
        () => ({})
      );

    const result =
      await restoreComment(
        new ObjectId(id),
        user,
        body.reason || ''
      );

    if (!result.success) {
      return result.reason === 'NOT_RESTORABLE'
        ? failure('This comment was deleted by its author and cannot be restored', 409)
        : failure('Comment not found', 404);
    }

    return success(result, 'Comment restored successfully');
  } catch (error) {
    logApiError(
      'PATCH /api/admin/comments/[id]/restore',
      error
    );

    return failure('Unable to restore comment', 500);
  }
}
