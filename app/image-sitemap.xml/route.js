import { SITE_URL } from '@/lib/seo/config';

/**
 * Story images now live inside the article sitemaps (Google's recommended
 * setup), so the standalone image sitemap is retired. Anyone who still has
 * this URL submitted is redirected to the sitemap index.
 */
export function GET() {
  return Response.redirect(`${SITE_URL}/sitemap.xml`, 301);
}
