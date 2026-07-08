import { requireUser } from '@/lib/auth/user/requireUser';

import { getCollection } from '@/lib/mongodb';

import { COLLECTIONS } from '@/lib/constants/collections';

import { success, failure, } from '@/lib/api/response';

import { logApiError, } from '@/lib/api/errors';

import { getComments, addComment, } from '@/lib/services/comments/commentService';

export async function GET(request, { params }) {
  try {
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

    return success(
      result,
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

    if (!auth.success) {
      return auth.response;
    }

    const user = auth.user;

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

    // Read request body
    const body = await request.json();

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