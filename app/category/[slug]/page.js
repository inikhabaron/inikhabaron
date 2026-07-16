import { notFound } from 'next/navigation';
import JsonLd from '@/components/seo/JsonLd';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import ArticleGrid from '@/components/seo/ArticleGrid';
import SeoPageShell from '@/components/seo/SeoPageShell';
import { getCategory, getArticlesByCategory, getCategories } from '@/lib/seo/data';
import { SITE, SITE_URL, categoryUrl } from '@/lib/seo/config';
import { getCatLabel } from '@/lib/news-utils';
import { collectionPageSchema, breadcrumbSchema } from '@/lib/seo/jsonld';

export const revalidate = 300;
export const dynamicParams = true;

const PAGE_SIZE = 12;

function label(slug, category) {
  return category?.name || getCatLabel(slug, 'en') || slug;
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const category = await getCategory(slug);
  const name = label(slug, category);
  const title = `${name} News`;
  const description = `Latest ${name} news, updates and analysis from ${SITE.name}. Stay informed with breaking ${name} stories in Hindi and English.`;
  return {
    title,
    description,
    alternates: { canonical: categoryUrl(slug) },
    openGraph: {
      type: 'website',
      title: `${title} | ${SITE.name}`,
      description,
      url: categoryUrl(slug),
      siteName: SITE.name,
      images: [{ url: SITE.defaultImage, width: 1200, height: 630, alt: name }],
    },
    twitter: { card: 'summary_large_image', title, description, images: [SITE.defaultImage] },
  };
}

export default async function CategoryPage({ params, searchParams }) {
  const { slug } = await params;
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp?.page || '1', 10) || 1);

  const [category, { articles, total, pages }, allCategories] = await Promise.all([
    getCategory(slug),
    getArticlesByCategory(slug, { page, limit: PAGE_SIZE }),
    getCategories(),
  ]);

  // A category is valid if it exists OR has published articles under that slug.
  if (!category && total === 0) notFound();

  const name = label(slug, category);
  const crumbs = [
    { name: 'Home', url: SITE_URL },
    { name, url: categoryUrl(slug) },
  ];

  const jsonLd = [
    collectionPageSchema({
      name: `${name} News`,
      description: `Latest ${name} news from ${SITE.name}`,
      url: categoryUrl(slug),
      items: articles,
    }),
    breadcrumbSchema(crumbs),
  ];

  return (
    <SeoPageShell categories={allCategories} activeSlug={slug}>
      <JsonLd data={jsonLd} />
      <Breadcrumbs items={crumbs} />
      <h1 style={{ fontSize: '28px', margin: '8px 0 4px', color: '#111827' }}>{name} News</h1>
      <p style={{ color: '#4B5563', margin: '0 0 20px' }}>
        Latest {name} stories, updates and analysis — {total} article{total === 1 ? '' : 's'}.
      </p>

      <ArticleGrid articles={articles} />

      {/* Rel prev/next pagination for crawl efficiency */}
      {pages > 1 && (
        <nav aria-label="Pagination" style={{ display: 'flex', gap: '12px', justifyContent: 'center', margin: '28px 0' }}>
          {page > 1 && (
            <a rel="prev" href={`${categoryUrl(slug)}?page=${page - 1}`} style={pagerStyle}>← Previous</a>
          )}
          <span style={{ alignSelf: 'center', color: '#6B7280' }}>Page {page} of {pages}</span>
          {page < pages && (
            <a rel="next" href={`${categoryUrl(slug)}?page=${page + 1}`} style={pagerStyle}>Next →</a>
          )}
        </nav>
      )}
    </SeoPageShell>
  );
}

const pagerStyle = {
  padding: '8px 16px',
  borderRadius: '8px',
  background: '#152a58',
  color: '#fff',
  textDecoration: 'none',
  fontSize: '14px',
};
