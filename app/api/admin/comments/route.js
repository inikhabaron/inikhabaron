import { getUserFromToken } from '@/lib/auth/admin/token';
import {  canModerateComments, } from '@/lib/auth/permissions';
import { success, failure, } from '@/lib/api/response';
import { logApiError, } from '@/lib/api/errors';
import { getCommentsForModeration, } from '@/lib/services/comments/commentModerationService';

export async function GET(request) {
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

    const { searchParams } = new URL(request.url);

    const result =
      await getCommentsForModeration({
        status:
          searchParams.get('status'),

        articleId:
          searchParams.get('articleId'),

        userId:
          searchParams.get('userId'),

        reported:
          searchParams.get('reported') ===
          'true',

        page: Math.max(
          1,
          Number(
            searchParams.get('page')
          ) || 1
        ),

        limit: Math.min(
          100,
          Number(
            searchParams.get('limit')
          ) || 20
        ),
      });

    return success(
      result,
      'Comments fetched successfully'
    );
  } catch (error) {
    logApiError(
      'GET /api/admin/comments',
      error
    );

    return failure(
      'Unable to fetch comments',
      500
    );
  }
}