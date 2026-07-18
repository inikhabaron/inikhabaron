import { emailWrapper, articleCardHtml, plainTextFallback } from './shared';

/**
 * Breaking-news alert: one or more urgent articles, no other sections.
 * Reuses the same layout/article-card building blocks as the monthly digest
 * so both templates stay visually consistent.
 */
export function buildBreakingNewsletter({ email, articles = [] }) {
  const subject = articles.length === 1
    ? `Breaking: ${articles[0].title}`
    : 'Breaking News Alert — INIKhabaron';

  const sections = [
    `
    <tr>
      <td style="padding:0 0 20px;">
        <p style="margin:0;font-size:13px;font-weight:700;color:#dc2626;text-transform:uppercase;letter-spacing:.05em;">Breaking News</p>
      </td>
    </tr>`,
    articles.map(articleCardHtml).join(''),
  ];

  const html = emailWrapper({
    previewText: articles[0]?.title || 'Breaking news from INIKhabaron',
    bodyHtml: sections.join(''),
    email,
  });

  const text = plainTextFallback({ heading: subject, articles });

  return { subject, html, text };
}
