import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Reads per-request state (headers/cookies/query), so it can never be
// prerendered. Declared explicitly: without this Next attempts a static render
// at build time, the attempt throws DYNAMIC_SERVER_USAGE, and the route's own
// catch block logs it as an application error — the build-log noise.
export const dynamic = 'force-dynamic';

export async function GET() {
  const cookieStore = await cookies();

  return NextResponse.json({
    cookies: cookieStore.getAll(),
  });
}