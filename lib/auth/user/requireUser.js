import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session/session';

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    return {
      success: false,
      response: NextResponse.json(
        {
          success: false,
          message: 'Authentication required',
        },
        {
          status: 401,
        }
      ),
    };
  }

  return {
    success: true,
    user,
  };
}