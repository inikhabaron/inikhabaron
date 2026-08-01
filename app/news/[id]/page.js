import { notFound } from 'next/navigation';
import NewsClient from './NewsClient';
import JsonLd from '@/components/seo/JsonLd';
import ArticleSeoContent from './ArticleSeoContent';
import { getArticle, getLatestArticles } from '@/lib/seo/data';
import {
  SITE,
  SITE_URL,
  articleUrl,
  categoryUrl,
} from '@/lib/seo/config';
import {
  optimizeTitle,
  optimizeDescription,
  generateKeywords,
  stripHtml,
} from '@/lib/seo/utils';
import {
  newsArticleSchema,
  breadcrumbSchema,
  faqSchema,
} from '@/lib/seo/jsonld';
import { getCatLabel } from '@/lib/news-utils';
import { getArticleAuthors, joinAuthorNames } from '@/lib/news/authors';

// ISR: article HTML is cached and revalidated in the background so TTFB is low
// while content stays fresh. On-demand updates still show within 60s.
export const revalidate = 60;
export const dynamicParams = true;

/**
 * Server-rendered, per-article metadata. Fully automatic — no editor input
 * required. Provides canonical, keywords, authors, published/modified times,
 * article section, locale, OpenGraph and Twitter cards, plus robots directives
 * tuned for maximum news/AI visibility.
 */
export async function generateMetadata({ params }) {
  const { id } = await params;
  const article = await getArticle(id);

  if (!article) {
    return {
      title: `${SITE.name} - Latest News`,
      description: SITE.description,
      alternates: { canonical: `${SITE_URL}/news/${id}` },
      robots: { index: false, follow: true },
    };
  }

  const title = optimizeTitle(article.seoTitle || article.title);
  const description = optimizeDescription(
    article.seoDescription || article.excerpt,
    article.content,
  );
  const canonical = articleUrl(article);
  const image = article.featuredImage || SITE.defaultImage;
  const keywords = generateKeywords({
    title: article.title,
    description: article.seoDescription || article.excerpt,
    category: article.category,
    tags: article.tags,
    entities: article.entities,
    extra: article.seoKeywords,
  });
  const lang = article.language === 'hi' ? 'hi_IN' : 'en_IN';
  const publishedTime = article.publishedAt || article.createdAt;
  const modifiedTime = article.updatedAt || publishedTime;
  // Every byline author, so a co-written story credits all of them rather
  // than only the first. Falls back to the site name for author-less pieces.
  const articleAuthors = getArticleAuthors(article);
  const authorNames = articleAuthors.length ? articleAuthors.map((a) => a.name) : [SITE.name];
  // "John Doe • Jane Smith" for the Twitter card's byline row.
  const socialByline = joinAuthorNames(articleAuthors) || SITE.name;

  return {
    title,
    description,
    keywords,
    authors: authorNames.map((name) => ({ name })),
    category: article.category,
    alternates: { canonical },
    openGraph: {
      type: 'article',
      title,
      description,
      url: canonical,
      siteName: SITE.name,
      locale: lang,
      publishedTime: publishedTime ? new Date(publishedTime).toISOString() : undefined,
      modifiedTime: modifiedTime ? new Date(modifiedTime).toISOString() : undefined,
      authors: authorNames,
      section: article.category,
      tags: Array.isArray(article.tags) ? article.tags : [],
      images: [{ url: image, width: 1200, height: 630, alt: article.title }],
    },
    twitter: {
      card: 'summary_large_image',
      site: SITE.social.twitterHandle,
      creator: SITE.social.twitterHandle,
      title,
      description,
      images: [image],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': -1,
      },
    },
    other: {
      'article:published_time': publishedTime ? new Date(publishedTime).toISOString() : '',
      'article:modified_time': modifiedTime ? new Date(modifiedTime).toISOString() : '',
      'article:section': article.category || 'News',
      // `article:author` is intentionally absent here: openGraph.authors above
      // already emits one such tag per author. Setting it again would append a
      // duplicate carrying only a flattened string, so a scraper reading the
      // last one would see a different byline than one reading the first.
      //
      // Twitter has no author field in the card spec — a label/data pair is
      // the only way the byline renders there, so it mirrors the OG list.
      'twitter:label1': 'Written by',
      'twitter:data1': socialByline,
      'geo.region': SITE.geo.region,
      'geo.placename': SITE.geo.placename,
    },
  };
}

export default async function Page({ params }) {
  const { id } = await params;

  // Fetch the article + latest stories directly from Mongo on the server so the
  // content is present in the initial HTML (crawlable by Google News + AI bots).
  const [article, latest] = await Promise.all([
    getArticle(id),
    getLatestArticles({ limit: 8 }),
  ]);

  if (!article || article.status !== 'published') {
    notFound();
  }

  const categoryLabel = getCatLabel(article.category, 'en') || article.category || 'News';
  const faqs = Array.isArray(article.faqs) ? article.faqs : [];

  // Build the structured-data graph for this story.
  const jsonLd = [
    newsArticleSchema(article, { faqs }),
    breadcrumbSchema([
      { name: 'Home', url: SITE_URL },
      { name: categoryLabel, url: categoryUrl(article.category) },
      { name: stripHtml(article.title).slice(0, 90), url: articleUrl(article) },
    ]),
    faqSchema(faqs),
  ];

  return (
    <>
      <JsonLd data={jsonLd} />
      {/*
        Semantic, server-rendered article content for crawlers/AI. It is
        visually hidden (sr-only) because the interactive NewsClient renders the
        styled UI — but the full headline, byline, dates, summary, body,
        entities and FAQs are present in the initial HTML for search + LLM
        ingestion.
      */}
      <ArticleSeoContent article={article} categoryLabel={categoryLabel} faqs={faqs} />
      {/* Interactive experience — seeded with server data (no loading flicker,
          and it also server-renders because state is pre-populated). */}
      <NewsClient initialArticle={article} initialLatest={latest} />
    </>
  );
}
