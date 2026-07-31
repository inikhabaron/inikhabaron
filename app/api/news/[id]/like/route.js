import { requireUser } from '@/lib/auth/user/requireUser';
import { getCollection } from '@/lib/mongodb';
import { COLLECTIONS } from '@/lib/constants/collections';
import { success, failure } from '@/lib/api/response';
import { logApiError } from '@/lib/api/errors';

import {
  addLike,
  removeLike,
  isLiked,
} from '@/lib/services/likes/likeService';

// Reads per-request state (headers/cookies/query), so it can never be
// prerendered. Declared explicitly: without this Next attempts a static render
// at build time, the attempt throws DYNAMIC_SERVER_USAGE, and the route's own
// catch block logs it as an application error — the build-log noise.
export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
  try {
    const auth = await requireUser();

    if (!auth.success) {
      return auth.response;
    }

    const user = auth.user;

    const { id: articleId } = await params;

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

    const result = await addLike(
      user.id,
      articleId
    );

    return success(
      result,
      result.alreadyExists
        ? 'Article already liked'
        : 'Article liked successfully'
    );
  } catch (error) {
    logApiError(
      'POST /api/news/[id]/like',
      error
    );

    return failure(
      'Unable to like article',
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

    const user = auth.user;

    const { id: articleId } = await params;

    const result = await removeLike(
      user.id,
      articleId
    );

    return success(
      result,
      result.deleted
        ? 'Article unliked successfully'
        : 'Like not found'
    );
  } catch (error) {
    logApiError(
      'DELETE /api/news/[id]/like',
      error
    );

    return failure(
      'Unable to remove like',
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

    const { id: articleId } = await params;

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

    const result = await isLiked(
      auth.user.id,
      articleId
    );

    return success(
      result,
      'Like status fetched successfully'
    );
  } catch (error) {
    logApiError(
      'GET /api/news/[id]/like',
      error
    );

    return failure(
      'Unable to fetch like status',
      500
    );
  }
}