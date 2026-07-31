import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/user/requireUser';

// Reads per-request state (headers/cookies/query), so it can never be
// prerendered. Declared explicitly: without this Next attempts a static render
// at build time, the attempt throws DYNAMIC_SERVER_USAGE, and the route's own
// catch block logs it as an application error — the build-log noise.
export const dynamic = 'force-dynamic';

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