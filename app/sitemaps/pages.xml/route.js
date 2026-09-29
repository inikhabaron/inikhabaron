import { SITE_URL, authorUrl, expertQuestionUrl, topicUrl } from '@/lib/seo/config';
import {
  getCategories, getAuthorsForSitemap, getCategoryLastModified,
  getAuthorLastModified, getTagsForSitemap,
} from '@/lib/seo/data';
import { getPublishedQuestionIdsForSitemap } from '@/lib/services/expert/expertQuestionService';
import { urlsetXml, xmlResponse } from '@/lib/seo/sitemapXml';

export const dynamic = 'force-dynamic';

/** Non-article URLs. Static pages carry no lastmod (we don't track when they change). */
export async function GET() {
  const staticPaths = [
    '/', '/live', '/about', '/contact', '/editorial-policy',
    '/corrections-policy', '/privacy-policy', '/ask-the-expert',
  ];
  const urls = staticPaths.map((p) => ({ loc: `${SITE_URL}${p === '/' ? '' : p}` || SITE_URL }));

  try {
    const [categories, authorIds, tags, questions, catMod, authorMod] = await Promise.all([
      getCategories(), getAuthorsForSitemap(), getTagsForSitemap(),
      getPublishedQuestionIdsForSitemap(), getCategoryLastModified(), getAuthorLastModified(),
    ]);
    categories.forEach((c) => urls.push({ loc: `${SITE_URL}/category/${c.slug}`, lastmod: catMod[c.slug] }));
    tags.forEach((t) => urls.push({ loc: topicUrl(t.slug), lastmod: t.updatedAt }));
    authorIds.forEach((id) => urls.push({ loc: authorUrl(id), lastmod: authorMod[id] }));
    questions.forEach((q) => urls.push({ loc: expertQuestionUrl(q.id), lastmod: q.updatedAt }));
  } catch (err) {
    console.error('[sitemap:pages] failed to load dynamic entries:', err.message);
  }

  return xmlResponse(urlsetXml(urls), 600);
}
