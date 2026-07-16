import { SITE, SITE_URL } from '@/lib/seo/config';
import { getLatestArticles } from '@/lib/seo/data';
import { stripHtml, truncate } from '@/lib/seo/utils';

export const revalidate = 900; // 15 minutes

function xmlEscape(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * RSS 2.0 feed of the latest stories. Also autodiscovered via the
 * <link rel="alternate" type="application/rss+xml"> emitted from the root
 * metadata. Useful for feed readers, syndication and some AI ingestion.
 */
export async function GET() {
  let articles = [];
  try {
    articles = await getLatestArticles({ limit: 40 });
  } catch (err) {
    console.error('[rss] failed:', err.message);
  }

  const items = articles
    .map((a) => {
      const link = `${SITE_URL}/news/${a.id}`;
      const pub = a.publishedAt ? new Date(a.publishedAt).toUTCString() : new Date().toUTCString();
      const desc = truncate(stripHtml(a.seoDescription || a.excerpt || a.content || ''), 300);
      return `    <item>
      <title>${xmlEscape(a.title || '')}</title>
      <link>${xmlEscape(link)}</link>
      <guid isPermaLink="true">${xmlEscape(link)}</guid>
      <pubDate>${pub}</pubDate>
      <category>${xmlEscape(a.category || 'News')}</category>
      <dc:creator>${xmlEscape(a.authorName || SITE.name)}</dc:creator>
      <description>${xmlEscape(desc)}</description>${
        a.featuredImage
          ? `\n      <enclosure url="${xmlEscape(a.featuredImage)}" type="image/jpeg" />`
          : ''
      }
    </item>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${xmlEscape(SITE.name)}</title>
    <link>${SITE_URL}</link>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />
    <description>${xmlEscape(SITE.description)}</description>
    <language>en-in</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <image>
      <url>${SITE.logo}</url>
      <title>${xmlEscape(SITE.name)}</title>
      <link>${SITE_URL}</link>
    </image>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=900, s-maxage=900, stale-while-revalidate=300',
    },
  });
}
