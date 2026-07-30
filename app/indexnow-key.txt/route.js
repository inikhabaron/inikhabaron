import { getIndexNowKey } from '@/lib/services/seo/indexNow';

/**
 * Serves the IndexNow verification key at /indexnow-key.txt.
 * Search engines fetch this to confirm we own the key used in submissions.
 */
export const dynamic = 'force-static';
export const revalidate = false;

export function GET() {
  const key = getIndexNowKey();
  if (!key) {
    return new Response('IndexNow key not configured', { status: 404 });
  }
  return new Response(key, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
