import { requireUser } from '@/lib/auth/user/requireUser';
import { json, preflight } from '@/lib/api/cors';
import {
  saveReadingProgress,
  normalizeReadingProgress,
  isReadingComplete,
  deleteReadingProgress,
} from '@/lib/services/readingProgress/readingProgressService';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const OPTIONS = preflight;

export async function POST(request) {
  try {
    const auth = await requireUser();

    if (!auth.success) {
      return auth.response;
    }

    const { articleId, scrollY, scrollPercent } = await request.json();

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

    const progress = normalizeReadingProgress({
      scrollY,
      scrollPercent,
    });

    // Remove progress once article is essentially finished
    if (isReadingComplete(progress.scrollPercent)) {
      await deleteReadingProgress({
        userId: auth.user.id,
        articleId,
      });

      return json({
        success: true,
        message: 'Reading completed.',
        completed: true,
      });
    }

    await saveReadingProgress({
      userId: auth.user.id,
      articleId,
      ...progress,
    });

    return json({
      success: true,
      message: 'Reading progress saved.',
      completed: false,
    });
  } catch (error) {
    console.error('POST /api/users/reading-progress error:', error);

    return json(
      {
        success: false,
        message: error.message || 'Failed to save reading progress.',
      },
      {
        status: 500,
      }
    );
  }
}