import { NextResponse } from 'next/server';

import { getFirebaseUserFromToken } from '@/lib/auth/user/firebaseUser';

import { signSession } from '@/lib/session/jwt';

import { setSessionCookie } from '@/lib/session/cookies';

export async function POST(request) {
  try {
    const body = await request.json();

    const { idToken } = body;

    if (!idToken) {
      return NextResponse.json(
        {
          success: false,
          message: 'Firebase ID Token is required',
        },
        {
          status: 400,
        }
      );
    }

    const user = await getFirebaseUserFromToken(idToken);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid Firebase token',
        },
        {
          status: 401,
        }
      );
    }

    const sessionToken = signSession(user);

    await setSessionCookie(sessionToken);

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      data: {
        user,
        // Web relies on the httpOnly cookie set above and can ignore this.
        // Mobile clients (no cookie jar) store this and send it back as
        // `Authorization: Bearer <token>` on every request.
        token: sessionToken,
      },
    });
  } catch (error) {
    console.error('Session API Error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Unable to create session',
      },
      {
        status: 500,
      }
    );
  }
}