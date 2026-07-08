import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/session/cookies';

export async function POST() {
  try {
    await clearSessionCookie();

    return NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('Logout Error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Unable to logout',
      },
      {
        status: 500,
      }
    );
  }
}