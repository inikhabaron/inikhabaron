import { requireUser } from '@/lib/auth/user/requireUser';
import { json, preflight } from '@/lib/api/cors';
import { getMyCityFeed } from '@/lib/services/location/myCityService';

export const OPTIONS = preflight;
export const revalidate = 86400;

export async function GET(request) {
  try {
    const auth = await requireUser();

    if (!auth.success) {
      return auth.response;
    }

    const { user } = auth;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const { articles, meta } = await getMyCityFeed(user, { limit });

    return json({
      success: true,
      data: articles,
      meta,
    });
  } catch (error) {
    console.error('GET /api/news/my-city error:', error);

    return json(
      {
        success: false,
        message: 'Failed to fetch My City news.',
      },
      { status: 500 }
    );
  }
}
