import { emailWrapper, articleCardHtml, sectionHeadingHtml, plainTextFallback } from './shared';

/**
 * Monthly digest: breaking news, top-viewed stories, featured articles and
 * latest news, in that order (sections are omitted when empty).
 */
export function buildMonthlyNewsletter({ email, breaking = [], topStories = [], featured = [], latest = [] }) {
  const monthLabel = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const subject = `INIKhabaron Monthly Digest — ${monthLabel}`;

  const sections = [
    `
    <tr>
      <td style="padding:0 0 20px;">
        <p style="margin:0;font-size:15px;color:#111827;">Hi there,</p>
        <p style="margin:8px 0 0;font-size:14px;color:#4b5563;line-height:1.6;">Here's what made headlines this month on INIKhabaron.</p>
      </td>
    </tr>`,
  ];

  if (breaking.length) {
    sections.push(sectionHeadingHtml('Breaking News'));
    sections.push(breaking.map(articleCardHtml).join(''));
  }
  if (topStories.length) {
    sections.push(sectionHeadingHtml('Top Stories'));
    sections.push(topStories.map(articleCardHtml).join(''));
  }
  if (featured.length) {
    sections.push(sectionHeadingHtml('Featured Articles'));
    sections.push(featured.map(articleCardHtml).join(''));
  }
  if (latest.length) {
    sections.push(sectionHeadingHtml('Latest News'));
    sections.push(latest.map(articleCardHtml).join(''));
  }

  const html = emailWrapper({
    previewText: `Your monthly digest from INIKhabaron — ${monthLabel}`,
    bodyHtml: sections.join(''),
    email,
  });

  const text = plainTextFallback({
    heading: `INIKhabaron Monthly Digest — ${monthLabel}`,
    articles: [...breaking, ...topStories, ...featured, ...latest],
  });

  return { subject, html, text };
}
