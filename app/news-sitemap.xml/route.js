import { SITE, SITE_URL } from '@/lib/seo/config';
import { getArticlesForSitemap } from '@/lib/seo/data';

// Google News only considers articles from the last 48 hours.
export const revalidate = 600; // refresh every 10 minutes
export const dynamic = 'force-dynamic';

function xmlEscape(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Google News sitemap.
 * Spec: https://support.google.com/news/publisher-center/answer/9606710
 * Only URLs published in the last 2 days, with <news:news> metadata.
 */
export async function GET() {
  let articles = [];
  try {
    articles = await getArticlesForSitemap({ sinceHours: 48, limit: 1000 });
  } catch (err) {
    console.error('[news-sitemap] failed:', err.message);
  }

  const items = articles
    .map((a) => {
      const loc = `${SITE_URL}/news/${a.id}`;
      const pub = a.publishedAt ? new Date(a.publishedAt).toISOString() : new Date().toISOString();
      const lang = a.language === 'hi' ? 'hi' : 'en';
      const keywords = Array.isArray(a.tags) ? a.tags.slice(0, 10).join(', ') : '';
      return `  <url>
    <loc>${xmlEscape(loc)}</loc>
    <news:news>
      <news:publication>
        <news:name>${xmlEscape(SITE.name)}</news:name>
        <news:language>${lang}</news:language>
      </news:publication>
      <news:publication_date>${pub}</news:publication_date>
      <news:title>${xmlEscape(a.title || '')}</news:title>${
        keywords ? `\n      <news:keywords>${xmlEscape(keywords)}</news:keywords>` : ''
      }
    </news:news>${
      a.featuredImage
        ? `\n    <image:image><image:loc>${xmlEscape(a.featuredImage)}</image:loc></image:image>`
        : ''
    }
  </url>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${items}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=600, s-maxage=600, stale-while-revalidate=300',
    },
  });
}
