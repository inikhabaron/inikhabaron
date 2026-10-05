import { requireUser } from '@/lib/auth/user/requireUser';
import { getCollection } from '@/lib/mongodb';
import { COLLECTIONS } from '@/lib/constants/collections';
import { success, failure, } from '@/lib/api/response';
import { logApiError, } from '@/lib/api/errors';
import { getComments, addComment, } from '@/lib/services/comments/commentService';
import { autoApprovePendingComments } from '@/lib/services/comments/autoApproveComments';
import {
  getCommentModerationSettings,
  isGuestCommentingEnabled,
} from '@/lib/services/settings/commentModerationService';
import { evaluateGuestSubmission } from '@/lib/services/comments/guestCommentGuard';
import { issueFormToken } from '@/lib/services/comments/guestFormToken';
import { getPublicCaptchaConfig } from '@/lib/services/comments/guestCaptcha';
import { COMMENTS_CLOSED_MESSAGE } from '@/lib/services/comments/articleCommentsService';
import { runGuestCommentAlertCheck } from '@/lib/services/comments/guestCommentAlertService';
import { getClientIp, getClientFingerprint } from '@/lib/api/clientIdentity';

// A guest submission is a few hundred bytes of JSON; anything near this is not
// a comment. Checked before the body is parsed.
const MAX_GUEST_BODY_BYTES = 8 * 1024;

// Guest comments are published immediately and reviewed by editors afterwards.
const GUEST_POSTED_MESSAGE = 'Your comment has been posted.';

// Reads per-request state (headers/cookies/query), so it can never be
// prerendered. Declared explicitly: without this Next attempts a static render
// at build time, the attempt throws DYNAMIC_SERVER_USAGE, and the route's own
// catch block logs it as an application error — the build-log noise.
export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    await autoApprovePendingComments();

    const { id: articleId } = await params;

    // Check article exists
    const newsCollection = await getCollection(COLLECTIONS.NEWS);

    const article = await newsCollection.findOne({
      id: articleId,
    });

    if (!article) {
      return failure(
        'Article not found',
        404,
        {
          code: 'ARTICLE_NOT_FOUND',
        }
      );
    }

    // Pagination
    const { searchParams } = new URL(request.url);

    const page = Math.max(
      1,
      Number(searchParams.get('page')) || 1
    );

    const limit = Math.min(
      50,
      Number(searchParams.get('limit')) || 20
    );

    const result = await getComments(
      articleId,
      page,
      limit
    );

    // Lets the page show the comment form to logged-out visitors without a
    // second round trip. Display only — POST re-checks the flag server-side.
    // formToken is the server-signed "form shown at" stamp that guest posts
    // must echo back (see guestFormToken.js); only issued when guests may post.
    const settings =
      await getCommentModerationSettings();

    const guestCommentsAllowed =
      settings.allowGuestComments === true;

    // Public comment loads are also the heartbeat for the unreviewed-guest-
    // comment alert (see guestCommentAlertService.js): throttled, time-boxed
    // and unable to throw, so it can never hold up or fail this response.
    await runGuestCommentAlertCheck({ settings });

    return success(
      {
        ...result,
        guestCommentsAllowed,
        formToken: guestCommentsAllowed ? issueFormToken() : null,
        // Widget config for the browser (site key only); null = no CAPTCHA.
        captcha: guestCommentsAllowed ? getPublicCaptchaConfig() : null,
        commentsClosed: article.commentsClosed === true,
      },
      'Comments fetched successfully'
    );
  } catch (error) {
    logApiError(
      'GET /api/news/[id]/comments',
      error
    );

    return failure(
      'Unable to fetch comments',
      500
    );
  }
}

export async function POST(request, { params }) {
  try {
    const auth = await requireUser();

    // Commenting is login-only unless an admin has switched guest commenting
    // on (Comments → Moderation settings). With the flag off, a visitor without
    // a session gets exactly the 401 they always did.
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

    const { id: articleId } = await params;

    // Check article exists
    const newsCollection = await getCollection(COLLECTIONS.NEWS);

    const article = await newsCollection.findOne({
      id: articleId,
    });

    if (!article) {
      return failure(
        'Article not found',
        404,
        {
          code: 'ARTICLE_NOT_FOUND',
        }
      );
    }

    if (article.commentsClosed === true) {
      return failure(
        COMMENTS_CLOSED_MESSAGE,
        403,
        {
          code: 'COMMENTS_CLOSED',
        }
      );
    }

    // Read request body
    const body = await request.json();

    if (!auth.success) {
      // A logged-in client with an expired session sends no `guest` block, so
      // it still gets the normal "authentication required" and re-logs in
      // rather than silently posting as a guest.
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
        thread: { articleId, parentCommentId: null },
      });

      if (check.silent) {
        // Honeypot tripped: look successful, store nothing.
        return success(
          { id: null, status: 'approved' },
          GUEST_POSTED_MESSAGE
        );
      }

      if (!check.ok) {
        return failure(check.message, check.status);
      }

      const guestResult = await addComment(
        null,
        articleId,
        check.content,
        { guest: check.guest }
      );

      // A new guest comment is the moment the review queue grows: check whether
      // the team needs an alert (time-boxed, never throws).
      await runGuestCommentAlertCheck();

      return success(guestResult, GUEST_POSTED_MESSAGE);
    }

    const user = auth.user;

    const content = body.content?.trim();

    // Validation
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

    // Create comment
    const result = await addComment(
      user.id,
      articleId,
      content
    );

    return success(
      result,
      'Comment submitted for review'
    );
  } catch (error) {
    logApiError(
      'POST /api/news/[id]/comments',
      error
    );

    return failure(
      'Unable to submit comment',
      500
    );
  }
}