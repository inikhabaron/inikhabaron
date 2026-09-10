import JsonLd from '@/components/seo/JsonLd';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import SeoPageShell from '@/components/seo/SeoPageShell';
import AskExpertForm from '@/components/expert/AskExpertForm';
import { getCategories } from '@/lib/seo/data';
import { getPublishedQuestions } from '@/lib/services/expert/expertQuestionService';
import { SITE, SITE_URL, expertQuestionUrl } from '@/lib/seo/config';
import { breadcrumbSchema } from '@/lib/seo/jsonld';

export const revalidate = 300;

const PAGE_SIZE = 12;
const ASK_EXPERT_URL = `${SITE_URL}/ask-the-expert`;

export async function generateMetadata() {
  const title = 'Ask the Expert';
  const description = `Have a question? Submit it and get answered by a ${SITE.name} expert. Browse previously answered questions by category.`;
  return {
    title,
    description,
    alternates: { canonical: ASK_EXPERT_URL },
    openGraph: {
      type: 'website',
      title: `${title} | ${SITE.name}`,
      description,
      url: ASK_EXPERT_URL,
      siteName: SITE.name,
      images: [{ url: SITE.defaultImage, width: 1200, height: 630, alt: title }],
    },
  };
}

export default async function AskTheExpertPage({ searchParams }) {
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp?.page || '1', 10) || 1);
  const category = sp?.category || undefined;

  const [categories, result] = await Promise.all([
    getCategories(),
    getPublishedQuestions({ category, page, limit: PAGE_SIZE }),
  ]);

  const { items, total, pagination } = result;
  const pages = pagination?.pages ?? Math.ceil((total || 0) / PAGE_SIZE);

  const crumbs = [
    { name: 'Home', url: SITE_URL },
    { name: 'Ask the Expert', url: ASK_EXPERT_URL },
  ];

  const pageUrl = category ? `${ASK_EXPERT_URL}?category=${category}` : ASK_EXPERT_URL;

  return (
    <SeoPageShell categories={categories}>
      <JsonLd data={[breadcrumbSchema(crumbs)]} />
      <Breadcrumbs items={crumbs} />

      <h1 style={{ fontSize: '28px', margin: '8px 0 4px', color: '#111827' }}>Ask the Expert</h1>
      <p style={{ color: '#4B5563', margin: '0 0 20px' }}>
        Submit a question and get it answered by our experts, or browse previously answered questions.
      </p>

      <AskExpertForm categories={categories} />

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '0 0 20px' }}>
        <a
          href={ASK_EXPERT_URL}
          style={{
            padding: '6px 14px', borderRadius: 999, fontSize: 13, textDecoration: 'none',
            background: !category ? '#152a58' : '#F3F4F6',
            color: !category ? '#fff' : '#374151',
          }}
        >
          All
        </a>
        {categories.map((cat) => (
          <a
            key={cat.slug}
            href={`${ASK_EXPERT_URL}?category=${cat.slug}`}
            style={{
              padding: '6px 14px', borderRadius: 999, fontSize: 13, textDecoration: 'none',
              background: category === cat.slug ? '#152a58' : '#F3F4F6',
              color: category === cat.slug ? '#fff' : '#374151',
            }}
          >
            {cat.name}
          </a>
        ))}
      </div>

      {items.length === 0 ? (
        <p style={{ color: '#6B7280' }}>No answered questions yet{category ? ' in this category' : ''}.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {items.map((item) => (
            <a
              key={item.id}
              href={expertQuestionUrl(item.id)}
              style={{ display: 'block', textDecoration: 'none', color: 'inherit', border: '1px solid #E8EAED', borderRadius: 12, padding: 18 }}
            >
              <span style={{ fontSize: 12, color: '#152a58', fontWeight: 600, textTransform: 'uppercase' }}>{item.category}</span>
              <h2 style={{ fontSize: 17, margin: '6px 0 8px', color: '#111827' }}>{item.question}</h2>
              <p style={{ fontSize: 14, color: '#4B5563', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                {item.answer}
              </p>
              {item.expert?.name && (
                <p style={{ fontSize: 12, color: '#9CA3AF', margin: '10px 0 0' }}>Answered by {item.expert.name}</p>
              )}
            </a>
          ))}
        </div>
      )}

      {pages > 1 && (
        <nav aria-label="Pagination" style={{ display: 'flex', gap: '12px', justifyContent: 'center', margin: '28px 0' }}>
          {page > 1 && (
            <a rel="prev" href={`${pageUrl}${pageUrl.includes('?') ? '&' : '?'}page=${page - 1}`} style={pagerStyle}>← Previous</a>
          )}
          <span style={{ alignSelf: 'center', color: '#6B7280' }}>Page {page} of {pages}</span>
          {page < pages && (
            <a rel="next" href={`${pageUrl}${pageUrl.includes('?') ? '&' : '?'}page=${page + 1}`} style={pagerStyle}>Next →</a>
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
