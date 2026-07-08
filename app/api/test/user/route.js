import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/user/requireUser';

export async function GET() {
  const auth = await requireUser();

  if (!auth.success) {
    return auth.response;
  }

  return NextResponse.json({
    success: true,
    user: auth.user,
  });
}