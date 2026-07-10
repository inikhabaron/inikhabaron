import { ObjectId } from 'mongodb';
import { requireUser } from '@/lib/auth/user/requireUser';
import { success, failure, } from '@/lib/api/response';
import { logApiError, } from '@/lib/api/errors';
import { getCommentsCollection, } from '@/lib/db/comments';
import { COMMENT_REPORT_REASONS } from '@/lib/services/comments/commentReportService';
import { reportComment, hasReportedComment, } from '@/lib/services/comments/commentReportService';

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

    const comments =
      await getCommentsCollection();

    const comment =
      await comments.findOne({
        _id: new ObjectId(id),
        isDeleted: false,
      });

    if (!comment) {
      return failure(
        'Comment not found',
        404,
        {
          code: 'COMMENT_NOT_FOUND',
        }
      );
    }

    const body = await request.json();

    const reason = body.reason?.trim() || 'Other';

    if (!COMMENT_REPORT_REASONS.includes(reason)) {
        return failure(
            'Invalid report reason',
            400
        );
    }

    const result =
      await reportComment(
        auth.user.id,
        new ObjectId(id),
        reason
      );

    return success(
      result,
      result.alreadyReported
        ? 'Comment already reported'
        : 'Comment reported successfully'
    );
  } catch (error) {
    logApiError(
      'POST /api/comments/[id]/report',
      error
    );

    return failure(
      'Unable to report comment',
      500
    );
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
      return failure(
        'Invalid comment id',
        400
      );
    }

    const comments =
      await getCommentsCollection();

    const comment =
      await comments.findOne({
        _id: new ObjectId(id),
        isDeleted: false,
      });

    if (!comment) {
      return failure(
        'Comment not found',
        404,
        {
          code: 'COMMENT_NOT_FOUND',
        }
      );
    }

    const result =
      await hasReportedComment(
        auth.user.id,
        new ObjectId(id)
      );

    return success(
      result,
      'Comment report status fetched successfully'
    );
  } catch (error) {
    logApiError(
      'GET /api/comments/[id]/report',
      error
    );

    return failure(
      'Unable to fetch report status',
      500
    );
  }
}