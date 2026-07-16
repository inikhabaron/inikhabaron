import { notFound } from 'next/navigation';
import JsonLd from '@/components/seo/JsonLd';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import ArticleGrid from '@/components/seo/ArticleGrid';
import SeoPageShell from '@/components/seo/SeoPageShell';
import { getAuthorWithArticles, getCategories } from '@/lib/seo/data';
import { SITE, SITE_URL, authorUrl } from '@/lib/seo/config';
import { personSchema, breadcrumbSchema, collectionPageSchema } from '@/lib/seo/jsonld';

export const revalidate = 600;
export const dynamicParams = true;

export async function generateMetadata({ params }) {
  const { id } = await params;
  const data = await getAuthorWithArticles(id);
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
    alternates: { canonical: authorUrl(id) },
    openGraph: {
      type: 'profile',
      title: `${author.name} | ${SITE.name}`,
      description,
      url: authorUrl(id),
      images: [{ url: author.avatar || SITE.defaultImage, width: 1200, height: 630, alt: author.name }],
    },
  };
}

export default async function AuthorPage({ params }) {
  const { id } = await params;
  const [data, categories] = await Promise.all([
    getAuthorWithArticles(id, { limit: 30 }),
    getCategories(),
  ]);
  if (!data) notFound();

  const { author, articles } = data;
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
      <header style={{ display: 'flex', gap: '16px', alignItems: 'center', margin: '12px 0 24px' }}>
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
      </header>
      <h2 style={{ fontSize: '18px', margin: '0 0 16px' }}>Latest by {author.name}</h2>
      <ArticleGrid articles={articles} />
    </SeoPageShell>
  );
}
