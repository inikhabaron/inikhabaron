import { SITE_URL } from '@/lib/seo/config';
import { getArticlesForSitemap, getCategories } from '@/lib/seo/data';

// Revalidate the sitemap hourly so new stories appear quickly.
export const revalidate = 3600;

/**
 * Primary sitemap.xml (Next.js Metadata Route).
 *
 * Covers static pages, all category listings and every published article, with
 * freshness-weighted changeFrequency / priority. The Google-News-specific and
 * image-specific sitemaps live in their own routes.
 */
export default async function sitemap() {
  const now = new Date();

  const staticPages = [
    { url: `${SITE_URL}/`, changeFrequency: 'hourly', priority: 1.0 },
    { url: `${SITE_URL}/live`, changeFrequency: 'always', priority: 0.9 },
    { url: `${SITE_URL}/about`, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${SITE_URL}/contact`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/editorial-policy`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/corrections-policy`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/privacy-policy`, changeFrequency: 'yearly', priority: 0.3 },
  ].map((p) => ({ ...p, lastModified: now }));

  let categoryPages = [];
  let articlePages = [];

  try {
    const [categories, articles] = await Promise.all([
      getCategories(),
      getArticlesForSitemap({ limit: 5000 }),
    ]);

    categoryPages = categories.map((c) => ({
      url: `${SITE_URL}/category/${c.slug}`,
      lastModified: now,
      changeFrequency: 'hourly',
      priority: 0.7,
    }));

    articlePages = articles.map((a) => {
      const published = a.publishedAt ? new Date(a.publishedAt) : now;
      const ageDays = (now - published) / 86400000;
      // Fresh stories get higher priority + change frequency.
      const priority = ageDays < 2 ? 0.9 : ageDays < 14 ? 0.7 : 0.5;
      const changeFrequency = ageDays < 2 ? 'hourly' : ageDays < 14 ? 'daily' : 'weekly';
      return {
        url: `${SITE_URL}/news/${a.id}`,
        lastModified: a.updatedAt ? new Date(a.updatedAt) : published,
        changeFrequency,
        priority,
      };
    });
  } catch (err) {
    console.error('[sitemap] failed to load dynamic entries:', err.message);
  }

  return [...staticPages, ...categoryPages, ...articlePages];
}
