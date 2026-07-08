import { NextResponse } from 'next/server';

import { getCurrentUser } from '@/lib/session/session';

import { getPersonalizedFeed } from '@/lib/services/recommendations/personalizedFeedService';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    const page =
      Number(searchParams.get('page')) || 1;

    const limit =
      Number(searchParams.get('limit')) || 20;

    const user = await getCurrentUser();

    const result = await getPersonalizedFeed({
      userId: user?.id,
      page,
      limit,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error(
      'GET /api/news/personalized',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          'Failed to load personalized feed.',
      },
      {
        status: 500,
      }
    );
  }
}