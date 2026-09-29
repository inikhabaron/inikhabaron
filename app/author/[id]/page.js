import { notFound } from 'next/navigation';
import JsonLd from '@/components/seo/JsonLd';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import ArticleGrid from '@/components/seo/ArticleGrid';
import SeoPageShell from '@/components/seo/SeoPageShell';
import AuthorFollowButton from '@/components/authors/AuthorFollowButton';
import { getAuthorWithArticles, getCategories } from '@/lib/seo/data';
import { SITE, SITE_URL, paginatedUrl, authorUrl } from '@/lib/seo/config';
import { personSchema, breadcrumbSchema, collectionPageSchema } from '@/lib/seo/jsonld';

export const revalidate = 600;
export const dynamicParams = true;

const PAGE_SIZE = 30;

export async function generateMetadata({ params, searchParams }) {
  const { id } = await params;
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp?.page || '1', 10) || 1);
  const data = await getAuthorWithArticles(id, { page, limit: PAGE_SIZE });
  if (!data) {
    return { title: 'Author', robots: { index: false, follow: true } };
  }
  const { author } = data;
  const title = `${author.name} — Author`;
  const description = author.bio
    ? author.bio
    : `Read the latest stories and reporting by ${author.name} at ${SITE.name}.`;
  return {
    title,
    description,
    alternates: { canonical: paginatedUrl(authorUrl(id), page) },
    openGraph: {
      type: 'profile',
      title: `${author.name} | ${SITE.name}`,
      description,
      url: paginatedUrl(authorUrl(id), page),
      images: [{ url: author.avatar || SITE.defaultImage, width: 1200, height: 630, alt: author.name }],
    },
  };
}

export default async function AuthorPage({ params, searchParams }) {
  const { id } = await params;
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp?.page || '1', 10) || 1);
  const [data, categories] = await Promise.all([
    getAuthorWithArticles(id, { page, limit: PAGE_SIZE }),
    getCategories(),
  ]);
  if (!data) notFound();

  const { author, articles, total, pages } = data;
  const crumbs = [
    { name: 'Home', url: SITE_URL },
    { name: author.name, url: authorUrl(id) },
  ];

  const jsonLd = [
    personSchema(author),
    collectionPageSchema({
      name: `Articles by ${author.name}`,
      description: `Stories written by ${author.name} for ${SITE.name}`,
      url: authorUrl(id),
      items: articles,
    }),
    breadcrumbSchema(crumbs),
  ];

  return (
    <SeoPageShell categories={categories}>
      <JsonLd data={jsonLd} />
      <Breadcrumbs items={crumbs} />
      <header style={{ display: 'flex', gap: '16px', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', margin: '12px 0 24px' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          {author.avatar && (
            <img src={author.avatar} alt={author.name} width={72} height={72} style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover' }} />
          )}
          <div>
            <h1 style={{ fontSize: '26px', margin: '0 0 4px' }}>{author.name}</h1>
            <p style={{ color: '#4B5563', margin: 0 }}>
              {author.role ? `${author.role} · ` : ''}{SITE.name}
            </p>
            {author.bio && <p style={{ color: '#4B5563', marginTop: '8px', maxWidth: '640px' }}>{author.bio}</p>}
          </div>
        </div>
        <AuthorFollowButton authorId={id} />
      </header>
      <h2 style={{ fontSize: '18px', margin: '0 0 16px' }}>
        Latest by {author.name} — {total} article{total === 1 ? '' : 's'}
      </h2>
      <ArticleGrid articles={articles} />

      {pages > 1 && (
        <nav aria-label="Pagination" style={{ display: 'flex', gap: '12px', justifyContent: 'center', margin: '28px 0' }}>
          {page > 1 && (
            <a rel="prev" href={`${authorUrl(id)}?page=${page - 1}`} style={pagerStyle}>← Previous</a>
          )}
          <span style={{ alignSelf: 'center', color: '#6B7280' }}>Page {page} of {pages}</span>
          {page < pages && (
            <a rel="next" href={`${authorUrl(id)}?page=${page + 1}`} style={pagerStyle}>Next →</a>
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
