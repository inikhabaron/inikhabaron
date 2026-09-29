/** Small helpers shared by the sitemap route handlers. */

export function xmlEscape(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

const iso = (d) => {
  if (!d) return undefined;
  const date = d instanceof Date ? d : new Date(d);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
};

/**
 * @param {Array<{loc:string, lastmod?:any, images?:string[]}>} urls
 * `lastmod` is emitted only when known — a made-up "now" on every URL teaches
 * Google to ignore the field.
 */
export function urlsetXml(urls) {
  const body = urls
    .map((u) => {
      const lastmod = iso(u.lastmod);
      const images = (u.images || []).filter(Boolean)
        .map((src) => `\n    <image:image><image:loc>${xmlEscape(src)}</image:loc></image:image>`)
        .join('');
      return `  <url>\n    <loc>${xmlEscape(u.loc)}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ''}${images}\n  </url>`;
    })
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${body}
</urlset>`;
}

export function xmlResponse(xml, maxAge = 600) {
  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': `public, max-age=${maxAge}, s-maxage=${maxAge}, stale-while-revalidate=300`,
    },
  });
}
