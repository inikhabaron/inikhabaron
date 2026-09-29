import { notFound } from 'next/navigation';
import JsonLd from '@/components/seo/JsonLd';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import ArticleGrid from '@/components/seo/ArticleGrid';
import SeoPageShell from '@/components/seo/SeoPageShell';
import TopicFollowButton from '@/components/topics/TopicFollowButton';
import { getTag, getArticlesByTag, getCategories } from '@/lib/seo/data';
import { SITE, SITE_URL, paginatedUrl, topicUrl } from '@/lib/seo/config';
import { collectionPageSchema, breadcrumbSchema } from '@/lib/seo/jsonld';

export const revalidate = 300;
export const dynamicParams = true;

const PAGE_SIZE = 12;

export async function generateMetadata({ params, searchParams }) {
  const { slug } = await params;
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp?.page || '1', 10) || 1);
  const tag = await getTag(slug);
  const name = tag?.name || slug;
  const title = page > 1 ? `#${name} News - Page ${page}` : `#${name} News`;
  const description = `Latest ${name} news, updates and analysis from ${SITE.name}. Follow the topic to stay updated.`;
  return {
    title,
    description,
    alternates: { canonical: paginatedUrl(topicUrl(slug), page) },
    openGraph: {
      type: 'website',
      title: `${title} | ${SITE.name}`,
      description,
      url: paginatedUrl(topicUrl(slug), page),
      siteName: SITE.name,
      images: [{ url: SITE.defaultImage, width: 1200, height: 630, alt: name }],
    },
    twitter: { card: 'summary_large_image', title, description, images: [SITE.defaultImage] },
  };
}

export default async function TopicPage({ params, searchParams }) {
  const { slug } = await params;
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp?.page || '1', 10) || 1);

  const [tag, allCategories] = await Promise.all([getTag(slug), getCategories()]);

  // Unlike categories, a topic with no matching articles yet is still a
  // real, followable tag record — only a genuinely nonexistent/inactive
  // slug 404s.
  if (!tag) notFound();

  const { articles, total, pages } = await getArticlesByTag(tag.name, { page, limit: PAGE_SIZE });

  const crumbs = [
    { name: 'Home', url: SITE_URL },
    { name: `#${tag.name}`, url: topicUrl(slug) },
  ];

  const jsonLd = [
    collectionPageSchema({
      name: `#${tag.name} News`,
      description: `Latest ${tag.name} news from ${SITE.name}`,
      url: topicUrl(slug),
      items: articles,
    }),
    breadcrumbSchema(crumbs),
  ];

  return (
    <SeoPageShell categories={allCategories}>
      <JsonLd data={jsonLd} />
      <Breadcrumbs items={crumbs} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <h1 style={{ fontSize: '28px', margin: '8px 0 4px', color: '#111827' }}>#{tag.name} News</h1>
        <TopicFollowButton tag={{ id: tag.id, name: tag.name }} />
      </div>
      <p style={{ color: '#4B5563', margin: '0 0 20px' }}>
        Latest {tag.name} stories, updates and analysis — {total} article{total === 1 ? '' : 's'}.
      </p>

      <ArticleGrid articles={articles} />

      {pages > 1 && (
        <nav aria-label="Pagination" style={{ display: 'flex', gap: '12px', justifyContent: 'center', margin: '28px 0' }}>
          {page > 1 && (
            <a rel="prev" href={`${topicUrl(slug)}?page=${page - 1}`} style={pagerStyle}>← Previous</a>
          )}
          <span style={{ alignSelf: 'center', color: '#6B7280' }}>Page {page} of {pages}</span>
          {page < pages && (
            <a rel="next" href={`${topicUrl(slug)}?page=${page + 1}`} style={pagerStyle}>Next →</a>
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
