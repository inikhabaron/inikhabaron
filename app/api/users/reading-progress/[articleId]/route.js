import { requireUser } from '@/lib/auth/user/requireUser';
import { json, preflight } from '@/lib/api/cors';
import { getReadingProgress, deleteReadingProgress } from '@/lib/services/readingProgress/readingProgressService';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const OPTIONS = preflight;

export async function GET(request, { params }) {
  try {
    const auth = await requireUser();

    if (!auth.success) {
      return auth.response;
    }

    const { articleId } = await params;

    if (!articleId) {
      return json(
        {
          success: false,
          message: 'Article ID is required.',
        },
        {
          status: 400,
        }
      );
    }

    const progress = await getReadingProgress({
      userId: auth.user.id,
      articleId,
    });

    return json({
      success: true,
      data: progress
        ? {
            scrollY: progress.scrollY ?? 0,
            scrollPercent: progress.scrollPercent ?? 0,
            updatedAt: progress.updatedAt,
          }
        : null,
    });
  } catch (error) {
    console.error(
      'GET /api/users/reading-progress/[articleId] error:',
      error
    );

    return json(
      {
        success: false,
        message: error.message || 'Failed to fetch reading progress.',
      },
      {
        status: 500,
      }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const auth = await requireUser();

    if (!auth.success) {
      return auth.response;
    }

    const { articleId } = await params;

    if (!articleId) {
      return json(
        {
          success: false,
          message: 'Article ID is required.',
        },
        {
          status: 400,
        }
      );
    }

    const deleted = await deleteReadingProgress({
      userId: auth.user.id,
      articleId,
    });

    return json({
      success: true,
      message: deleted
        ? 'Reading progress removed.'
        : 'Reading progress not found.',
      deleted,
    });
  } catch (error) {
    console.error(
      'DELETE /api/users/reading-progress/[articleId] error:',
      error
    );

    return json(
      {
        success: false,
        message: error.message || 'Failed to delete reading progress.',
      },
      {
        status: 500,
      }
    );
  }
}