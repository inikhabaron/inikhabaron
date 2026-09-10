import { notFound } from 'next/navigation';
import JsonLd from '@/components/seo/JsonLd';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import SeoPageShell from '@/components/seo/SeoPageShell';
import { getCategories } from '@/lib/seo/data';
import { getQuestionById } from '@/lib/services/expert/expertQuestionService';
import { getAnswerForQuestion } from '@/lib/services/expert/expertAnswerService';
import { getCollection } from '@/lib/mongodb';
import { COLLECTIONS } from '@/lib/constants/collections';
import { SITE, SITE_URL, expertQuestionUrl } from '@/lib/seo/config';
import { breadcrumbSchema } from '@/lib/seo/jsonld';

export const revalidate = 300;
export const dynamicParams = true;

async function loadQuestion(id) {
  const question = await getQuestionById(id);
  if (!question || question.status !== 'published') return null;

  const answer = await getAnswerForQuestion(id);
  if (!answer || answer.status !== 'published') return null;

  const usersCollection = await getCollection(COLLECTIONS.USERS);
  const expert = await usersCollection.findOne(
    { id: answer.expertId },
    { projection: { id: 1, name: 1, avatar: 1 } },
  );

  return { question, answer, expert };
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const data = await loadQuestion(id);
  if (!data) {
    return { title: 'Question', robots: { index: false, follow: true } };
  }
  const { question, answer } = data;
  const description = answer.answer.length > 160 ? `${answer.answer.slice(0, 160)}…` : answer.answer;
  return {
    title: question.question,
    description,
    alternates: { canonical: expertQuestionUrl(id) },
    openGraph: {
      type: 'article',
      title: `${question.question} | ${SITE.name}`,
      description,
      url: expertQuestionUrl(id),
      siteName: SITE.name,
      images: [{ url: SITE.defaultImage, width: 1200, height: 630, alt: question.question }],
    },
  };
}

export default async function AskTheExpertDetailPage({ params }) {
  const { id } = await params;
  const [data, categories] = await Promise.all([loadQuestion(id), getCategories()]);
  if (!data) notFound();

  const { question, answer, expert } = data;
  const crumbs = [
    { name: 'Home', url: SITE_URL },
    { name: 'Ask the Expert', url: `${SITE_URL}/ask-the-expert` },
    { name: question.question.slice(0, 60), url: expertQuestionUrl(id) },
  ];

  const jsonLd = [
    breadcrumbSchema(crumbs),
    {
      '@context': 'https://schema.org',
      '@type': 'QAPage',
      mainEntity: {
        '@type': 'Question',
        name: question.question,
        text: question.question,
        answerCount: 1,
        acceptedAnswer: {
          '@type': 'Answer',
          text: answer.answer,
          dateCreated: new Date(answer.publishedAt).toISOString(),
          author: expert?.name ? { '@type': 'Person', name: expert.name } : undefined,
        },
      },
    },
  ];

  return (
    <SeoPageShell categories={categories}>
      <JsonLd data={jsonLd} />
      <Breadcrumbs items={crumbs} />

      <span style={{ fontSize: 12, color: '#152a58', fontWeight: 600, textTransform: 'uppercase' }}>{question.category}</span>
      <h1 style={{ fontSize: '26px', margin: '6px 0 20px', color: '#111827' }}>{question.question}</h1>

      <div style={{ border: '1px solid #E8EAED', borderRadius: 12, padding: 20 }}>
        <p style={{ fontSize: 15, lineHeight: 1.7, color: '#111827', margin: 0, whiteSpace: 'pre-wrap' }}>{answer.answer}</p>
        {expert?.name && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 18, paddingTop: 16, borderTop: '1px solid #F0F2F5' }}>
            {expert.avatar && (
              <img src={expert.avatar} alt={expert.name} width={36} height={36} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
            )}
            <span style={{ fontSize: 13, color: '#4B5563' }}>Answered by <strong>{expert.name}</strong></span>
          </div>
        )}
      </div>
    </SeoPageShell>
  );
}
