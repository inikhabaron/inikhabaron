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

import { isGuestCommentingEnabled } from '@/lib/services/settings/commentModerationService';
import {
  areCommentsClosedForComment,
  COMMENTS_CLOSED_MESSAGE,
} from '@/lib/services/comments/articleCommentsService';
import { runGuestCommentAlertCheck } from '@/lib/services/comments/guestCommentAlertService';
import { evaluateGuestSubmission } from '@/lib/services/comments/guestCommentGuard';
import { getClientIp, getClientFingerprint } from '@/lib/api/clientIdentity';

const MAX_GUEST_BODY_BYTES = 8 * 1024;

// Guest replies are published immediately and reviewed by editors afterwards.
const GUEST_POSTED_MESSAGE = 'Your reply has been posted.';

export async function POST(request, { params }) {
  try {
    const auth = await requireUser();

    // Login-only unless guest commenting is switched on; see the matching
    // block in POST /api/news/[id]/comments.
    const guestsAllowed =
      !auth.success && (await isGuestCommentingEnabled());

    if (!auth.success && !guestsAllowed) {
      return auth.response;
    }

    if (
      guestsAllowed &&
      Number(request.headers.get('content-length') || 0) > MAX_GUEST_BODY_BYTES
    ) {
      return failure('Request too large', 413);
    }

    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return failure(
        'Invalid comment id',
        400
      );
    }

    if (await areCommentsClosedForComment(new ObjectId(id))) {
      return failure(
        COMMENTS_CLOSED_MESSAGE,
        403,
        {
          code: 'COMMENTS_CLOSED',
        }
      );
    }

    const body = await request.json();

    let content;
    let guest = null;

    if (auth.success) {
      content = body.content?.trim();

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
    } else {
      if (!body.guest || typeof body.guest !== 'object') {
        return auth.response;
      }

      const check = await evaluateGuestSubmission({
        ip: getClientIp(request),
        fingerprint: getClientFingerprint(request),
        deviceId: body.guest.deviceId,
        content: body.content,
        name: body.guest.name,
        honeypot: body.guest.website,
        token: body.guest.token,
        captchaToken: body.guest.captchaToken,
        // articleId isn't known until the parent is loaded; replies are
        // de-duplicated per parent comment instead.
        thread: { articleId: null, parentCommentId: new ObjectId(id) },
      });

      if (check.silent) {
        return success(
          { id: null, status: 'approved' },
          GUEST_POSTED_MESSAGE
        );
      }

      if (!check.ok) {
        return failure(check.message, check.status);
      }

      content = check.content;
      guest = check.guest;
    }

    const result = await addReply(
      auth.success ? auth.user.id : null,
      new ObjectId(id),
      content,
      { guest }
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

    if (guest) {
      await runGuestCommentAlertCheck();
    }

    return success(
      result,
      guest ? GUEST_POSTED_MESSAGE : 'Reply submitted for review'
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