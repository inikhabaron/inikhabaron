import { SITE_URL } from '@/lib/seo/config';
import { getArticlesForSitemap } from '@/lib/seo/data';

export const revalidate = 3600;

function xmlEscape(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Image sitemap — helps Google Images / Discover surface our story imagery.
 * Spec: https://developers.google.com/search/docs/crawling-indexing/sitemaps/image-sitemaps
 */
export async function GET() {
  let articles = [];
  try {
    articles = await getArticlesForSitemap({ limit: 5000 });
  } catch (err) {
    console.error('[image-sitemap] failed:', err.message);
  }

  const items = articles
    .filter((a) => a.featuredImage)
    .map((a) => {
      const loc = `${SITE_URL}/news/${a.id}`;
      return `  <url>
    <loc>${xmlEscape(loc)}</loc>
    <image:image>
      <image:loc>${xmlEscape(a.featuredImage)}</image:loc>
      <image:title>${xmlEscape(a.title || '')}</image:title>
    </image:image>
  </url>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${items}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=1800',
    },
  });
}
