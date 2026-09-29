import { SITE_URL } from '@/lib/seo/config';
import { getArticlesForSitemap, SITEMAP_CHUNK_SIZE } from '@/lib/seo/data';
import { urlsetXml, xmlResponse } from '@/lib/seo/sitemapXml';

export const dynamic = 'force-dynamic';

/**
 * /sitemaps/articles/N — the Nth block of 10,000 published articles, oldest
 * first. Only the last block changes as new stories go out. Each URL carries
 * its real lastmod and featured image (this replaces the separate image sitemap).
 */
export async function GET(_request, { params }) {
  const { page: raw } = await params;
  const page = parseInt(String(raw).replace(/\.xml$/, ''), 10);
  if (!Number.isInteger(page) || page < 1) {
    return new Response('Not found', { status: 404 });
  }

  const articles = await getArticlesForSitemap({
    limit: SITEMAP_CHUNK_SIZE,
    skip: (page - 1) * SITEMAP_CHUNK_SIZE,
  });
  if (!articles.length && page > 1) {
    return new Response('Not found', { status: 404 });
  }

  const urls = articles.map((a) => ({
    loc: `${SITE_URL}/news/${a.id}`,
    lastmod: a.updatedAt || a.publishedAt,
    images: a.featuredImage ? [a.featuredImage] : [],
  }));
  return xmlResponse(urlsetXml(urls), 600);
}
