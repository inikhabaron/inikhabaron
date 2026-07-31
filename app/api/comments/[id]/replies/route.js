import { ObjectId } from 'mongodb';
import { success, failure, } from '@/lib/api/response';
import { logApiError, } from '@/lib/api/errors';
import { getReplies, } from '@/lib/services/comments/commentService';

// Reads per-request state (headers/cookies/query), so it can never be
// prerendered. Declared explicitly: without this Next attempts a static render
// at build time, the attempt throws DYNAMIC_SERVER_USAGE, and the route's own
// catch block logs it as an application error — the build-log noise.
export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return failure(
        'Invalid comment id',
        400
      );
    }

    const { searchParams } =
    new URL(request.url);

    const page = Math.max(
        1,
        Number(
            searchParams.get('page')
        ) || 1
    );

    const limit = Math.min(
        50,
        Number(
            searchParams.get('limit')
        ) || 20
    );

    const result = await getReplies(
      new ObjectId(id), 
      page,
      limit
    );

    return success(
      result,
      'Replies fetched successfully'
    );
  } catch (error) {
    logApiError(
      'GET /api/comments/[id]/replies',
      error
    );

    return failure(
      'Unable to fetch replies',
      500
    );
  }
}