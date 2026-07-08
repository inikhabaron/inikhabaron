import { ObjectId } from 'mongodb';

import { requireUser } from '@/lib/auth/user/requireUser';

import {
  success,
  failure,
} from '@/lib/api/response';

import {
  logApiError,
} from '@/lib/api/errors';

import {
  addReply,
} from '@/lib/services/comments/commentService';

export async function POST(request, { params }) {
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
        'Reply content is required',
        400
      );
    }

    if (content.length > 1000) {
      return failure(
        'Reply cannot exceed 1000 characters',
        400
      );
    }

    const result = await addReply(
      auth.user.id,
      new ObjectId(id),
      content
    );

    if (!result.success) {
      switch (result.reason) {
        case 'NOT_FOUND':
          return failure(
            'Parent comment not found',
            404
          );

        case 'PARENT_DELETED':
          return failure(
            'Cannot reply to a deleted comment',
            400
          );

        case 'NESTED_REPLY_NOT_ALLOWED':
          return failure(
            'Replies to replies are not allowed',
            400
          );
      }
    }

    return success(
      result,
      'Reply submitted for review'
    );
  } catch (error) {
    logApiError(
      'POST /api/comments/[id]/reply',
      error
    );

    return failure(
      'Unable to submit reply',
      500
    );
  }
}