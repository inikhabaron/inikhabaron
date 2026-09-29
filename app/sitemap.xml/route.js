import { SITE_URL } from '@/lib/seo/config';
import { countPublishedArticles, SITEMAP_CHUNK_SIZE } from '@/lib/seo/data';
import { xmlEscape, xmlResponse } from '@/lib/seo/sitemapXml';

// Rendered per request; the CDN cache (see xmlResponse) absorbs the traffic.
export const dynamic = 'force-dynamic';

/**
 * Sitemap index at /sitemap.xml. A single sitemap file caps at 50,000 URLs, and
 * the old one silently stopped at the newest 5,000 articles. The index lists:
 *   - /sitemaps/pages.xml        static pages, categories, topics, authors, Q&A
 *   - /sitemaps/articles/N       every published article, 10,000 per file
 * The Google News sitemap (/news-sitemap.xml) stays separate, as Google requires.
 */
export async function GET() {
  const total = await countPublishedArticles();
  const chunks = Math.max(1, Math.ceil(total / SITEMAP_CHUNK_SIZE));
  const now = new Date().toISOString();

  const entries = [
    `${SITE_URL}/sitemaps/pages.xml`,
    ...Array.from({ length: chunks }, (_, i) => `${SITE_URL}/sitemaps/articles/${i + 1}`),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.map((loc) => `  <sitemap><loc>${xmlEscape(loc)}</loc><lastmod>${now}</lastmod></sitemap>`).join('\n')}
</sitemapindex>`;
  return xmlResponse(xml, 600);
}
