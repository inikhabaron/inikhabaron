import { SITE, SITE_URL } from '@/lib/seo/config';
import { createUnsubscribeToken } from '../unsubscribeToken';

// Shared building blocks for newsletter HTML emails — layout wrapper, article
// cards, section headings — so monthlyNewsletter.js and breakingNewsletter.js
// (and future breaking-news/weekly templates) compose the same pieces instead
// of each re-implementing the email skeleton.

function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function categoryLabel(slug) {
  if (!slug) return '';
  return slug.charAt(0).toUpperCase() + slug.slice(1);
}

export function articleUrl(article) {
  return `${SITE_URL}/news/${article.id}`;
}

export function unsubscribeLink(email) {
  const token = createUnsubscribeToken(email);
  return `${SITE_URL}/newsletter/unsubscribe?email=${encodeURIComponent(email)}&token=${token}`;
}

export function articleCardHtml(article) {
  const url = articleUrl(article);
  const image = article.featuredImage
    ? `<img src="${esc(article.featuredImage)}" alt="${esc(article.title)}" width="544" style="width:100%;max-width:544px;height:auto;border-radius:8px;display:block;margin-bottom:12px;" />`
    : '';
  const excerpt = article.excerpt
    ? esc(article.excerpt.length > 160 ? `${article.excerpt.slice(0, 160)}…` : article.excerpt)
    : '';

  return `
    <tr>
      <td style="padding:0 0 28px;">
        ${image}
        <div style="font-size:12px;font-weight:700;color:#dc2626;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px;">${esc(categoryLabel(article.category))}</div>
        <a href="${url}" style="font-size:18px;font-weight:700;color:#111827;text-decoration:none;line-height:1.4;">${esc(article.title)}</a>
        ${excerpt ? `<p style="font-size:14px;color:#4b5563;line-height:1.6;margin:8px 0 12px;">${excerpt}</p>` : ''}
        <a href="${url}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;font-size:13px;font-weight:600;padding:9px 18px;border-radius:6px;">Read More &rarr;</a>
      </td>
    </tr>`;
}

export function sectionHeadingHtml(title) {
  return `
    <tr>
      <td style="padding:32px 0 16px;border-top:1px solid #e5e7eb;">
        <h2 style="margin:0;font-size:15px;font-weight:700;color:#111827;text-transform:uppercase;letter-spacing:.05em;">${esc(title)}</h2>
      </td>
    </tr>`;
}

export function emailWrapper({ previewText, bodyHtml, email }) {
  const unsubUrl = unsubscribeLink(email);
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${esc(SITE.name)}</title>
  </head>
  <body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(previewText || '')}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:94vw;background:#ffffff;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="background:#172b57;padding:24px 28px;text-align:center;">
                <img src="${SITE.logo}" alt="${esc(SITE.name)}" height="36" style="height:36px;display:inline-block;" />
              </td>
            </tr>
            <tr>
              <td style="padding:28px 28px 8px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  ${bodyHtml}
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 28px;background:#f9fafb;border-top:1px solid #e5e7eb;text-align:center;">
                <p style="margin:0 0 6px;font-size:12px;color:#6b7280;">&copy; ${new Date().getFullYear()} ${esc(SITE.name)}. All rights reserved.</p>
                <p style="margin:0;font-size:12px;">
                  <a href="${unsubUrl}" style="color:#6b7280;text-decoration:underline;">Unsubscribe</a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function plainTextFallback({ heading, articles }) {
  const lines = [heading, ''];
  for (const article of articles) {
    lines.push(`- ${article.title}`);
    lines.push(`  ${articleUrl(article)}`);
    lines.push('');
  }
  return lines.join('\n');
}
