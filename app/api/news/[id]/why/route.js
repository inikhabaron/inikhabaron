import { NextResponse } from 'next/server';

import { getCurrentUser } from '@/lib/session/session';

import { getRecommendationArticle } from '@/lib/services/recommendations/articleService';
import { getRecommendationReasons } from '@/lib/services/recommendations/reasonsService';

// Reads per-request state (headers/cookies/query), so it can never be
// prerendered. Declared explicitly: without this Next attempts a static render
// at build time, the attempt throws DYNAMIC_SERVER_USAGE, and the route's own
// catch block logs it as an application error — the build-log noise.
export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    const { id } = await params;

    const article = await getRecommendationArticle(id);

    if (!article) {
      return NextResponse.json(
        {
          success: false,
          message: 'Article not found',
        },
        { status: 404 }
      );
    }

    const user = await getCurrentUser();

    const reasons = await getRecommendationReasons(user, article);

    return NextResponse.json({
      success: true,
      data: {
        reasons,
      },
    });
  } catch (error) {
    console.error('GET /api/news/[id]/why', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to load recommendation reasons',
      },
      { status: 500 }
    );
  }
}