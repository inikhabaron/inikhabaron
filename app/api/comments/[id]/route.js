import { ObjectId } from 'mongodb';

import { requireUser } from '@/lib/auth/user/requireUser';

import { success, failure, } from '@/lib/api/response';

import { logApiError, } from '@/lib/api/errors';

import { updateComment, deleteComment, } from '@/lib/services/comments/commentService';

export async function PATCH(request, { params }) {
  try {
    const auth = await requireUser();

    if (!auth.success) {
      return auth.response;
    }

    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return failure(
        'Invalid comment id',
        400
      );
    }

    const body = await request.json();

    const content = body.content?.trim();

    if (!content) {
      return failure(
        'Comment content is required',
        400
      );
    }

    if (content.length > 1000) {
      return failure(
        'Comment cannot exceed 1000 characters',
        400
      );
    }

    const result = await updateComment(
      new ObjectId(id),
      auth.user.id,
      content
    );

    if (!result.success) {
      switch (result.reason) {
        case 'NOT_FOUND':
          return failure(
            'Comment not found',
            404
          );

        case 'FORBIDDEN':
          return failure(
            'You can edit only your own comments',
            403
          );

        case 'DELETED':
          return failure(
            'Comment has been deleted',
            400
          );
      }
    }

    return success(
      result,
      'Comment updated successfully'
    );
  } catch (error) {
    logApiError(
      'PATCH /api/comments/[id]',
      error
    );

    return failure(
      'Unable to update comment',
      500
    );
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
      return failure(
        'Invalid comment id',
        400
      );
    }

    const result = await deleteComment(
      new ObjectId(id),
      auth.user.id
    );

    if (!result.success) {
      switch (result.reason) {
        case 'NOT_FOUND':
          return failure(
            'Comment not found',
            404
          );

        case 'FORBIDDEN':
          return failure(
            'You can delete only your own comments',
            403
          );

        case 'ALREADY_DELETED':
          return failure(
            'Comment already deleted',
            400
          );
      }
    }

    return success(
      result,
      'Comment deleted successfully'
    );
  } catch (error) {
    logApiError(
      'DELETE /api/comments/[id]',
      error
    );

    return failure(
      'Unable to delete comment',
      500
    );
  }
}