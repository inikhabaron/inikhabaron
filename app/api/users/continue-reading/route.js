import { requireUser } from '@/lib/auth/user/requireUser';
import { json, preflight } from '@/lib/api/cors';
import { getContinueReading } from '@/lib/services/readingProgress/readingProgressService';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const OPTIONS = preflight;

export async function GET(request) {
  try {
    const auth = await requireUser();

    if (!auth.success) {
      return auth.response;
    }

    const { searchParams } = new URL(request.url);

    const limit = Number(searchParams.get('limit')) || 5;

    const articles = await getContinueReading({
      userId: auth.user.id,
      limit,
    });

    return json({
      success: true,
      data: articles,
      meta: {
        count: articles.length,
        limit,
      },
    });
  } catch (error) {
    console.error(
      'GET /api/users/continue-reading error:',
      error
    );

    return json(
      {
        success: false,
        message:
          error.message ||
          'Failed to fetch continue reading articles.',
      },
      {
        status: 500,
      }
    );
  }
}