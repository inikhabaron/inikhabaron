/**
 * JSON-LD structured-data builders.
 *
 * Every builder returns a plain object ready to be serialised into a
 * <script type="application/ld+json"> tag (see components/seo/JsonLd.js).
 * Structured data is the single most important signal for Google News, rich
 * results, AI Overviews and LLM-based search (ChatGPT / Perplexity / Gemini),
 * so each article emits a rich, interconnected graph.
 */

import {
  SITE,
  SITE_URL,
  SOCIAL_PROFILES,
  absoluteUrl,
  articleUrl,
  authorUrl,
  categoryUrl,
} from './config';
import { stripHtml, truncate, wordCount } from './utils';
import { getArticleAuthors } from '@/lib/news/authors';

const toIso = (d) => {
  if (!d) return undefined;
  const date = d instanceof Date ? d : new Date(d);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
};

/** Publisher Organization node — reused by article + global schema. */
export function organizationSchema() {
  return {
    '@type': 'NewsMediaOrganization',
    '@id': `${SITE_URL}/#organization`,
    name: SITE.name,
    legalName: SITE.legalName,
    url: SITE_URL,
    logo: {
      '@type': 'ImageObject',
      url: SITE.logo,
      width: SITE.logoWidth,
      height: SITE.logoHeight,
    },
    sameAs: SOCIAL_PROFILES,
    contactPoint: {
      '@type': 'ContactPoint',
      email: SITE.contactEmail,
      contactType: 'editorial',
      areaServed: SITE.geo.country,
      availableLanguage: ['en', 'hi'],
    },
  };
}

/** WebSite node with SearchAction (sitelinks search box). */
export function websiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    name: SITE.name,
    url: SITE_URL,
    description: SITE.description,
    inLanguage: ['en', 'hi'],
    publisher: { '@id': `${SITE_URL}/#organization` },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

/** Standalone Organization graph for the root layout. */
export function organizationGraph() {
  return {
    '@context': 'https://schema.org',
    ...organizationSchema(),
  };
}

/** BreadcrumbList from an ordered list of { name, url } items. */
export function breadcrumbSchema(items = []) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/** Person node for an author (E-E-A-T). */
export function personSchema(author = {}) {
  const id = author.id || author.authorId;
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': id ? `${authorUrl(id)}#person` : undefined,
    name: author.name || author.authorName || 'Editorial Team',
    url: id ? authorUrl(id) : undefined,
    jobTitle: author.role || author.authorLabel || 'Journalist',
    image: author.avatar || author.photo || undefined,
    description: author.bio || undefined,
    worksFor: { '@id': `${SITE_URL}/#organization` },
    sameAs: Array.isArray(author.social) ? author.social : undefined,
  };
}

/**
 * The primary NewsArticle schema for a story. Includes everything Google News
 * and AI search consumers look for: headline, dates, author, publisher, image,
 * articleSection, articleBody, keywords, wordCount, language and speakable.
 */
export function newsArticleSchema(article, { faqs = [] } = {}) {
  if (!article) return null;
  const url = articleUrl(article);
  const image = article.featuredImage || SITE.defaultImage;
  const images = [image, ...(article.images || []).map((i) => (typeof i === 'string' ? i : i?.url))].filter(Boolean);
  const bodyText = stripHtml(article.content || article.excerpt || '');
  const articleAuthors = getArticleAuthors(article);

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    '@id': `${url}#article`,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    url,
    headline: truncate(article.seoTitle || article.title, 110),
    description: truncate(stripHtml(article.seoDescription || article.excerpt || bodyText), 250),
    image: images.map((src) => ({
      '@type': 'ImageObject',
      url: src,
      width: 1200,
      height: 630,
    })),
    datePublished: toIso(article.publishedAt || article.createdAt),
    dateModified: toIso(article.updatedAt || article.publishedAt || article.createdAt),
    // schema.org accepts a single Person or an array — emit every byline
    // author so co-written stories credit all of them. Only the first carries
    // the authorId url, since that id identifies the one account that created
    // the article, not the whole byline.
    author: articleAuthors.length
      ? articleAuthors.map((a, index) => ({
        '@type': 'Person',
        name: a.name,
        image: a.image || undefined,
        url: index === 0 && article.authorId ? authorUrl(article.authorId) : undefined,
      }))
      : { '@type': 'Person', name: 'Editorial Team' },
    publisher: organizationSchema(),
    articleSection: article.category || 'News',
    articleBody: bodyText || undefined,
    wordCount: wordCount(article.content || '') || undefined,
    keywords: [
      ...(Array.isArray(article.seoKeywords) ? article.seoKeywords : []),
      ...(Array.isArray(article.tags) ? article.tags : []),
    ].filter(Boolean).join(', ') || undefined,
    inLanguage: article.language || 'en',
    isAccessibleForFree: true,
    thumbnailUrl: image,
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: ['h1', '.article-summary', '.article-body'],
    },
    isPartOf: { '@id': `${SITE_URL}/#website` },
    // Named-entity mentions boost entity understanding for AI search.
    about: buildAboutEntities(article),
  };

  // Attach an embedded FAQ if the article provides Q&A pairs.
  if (Array.isArray(faqs) && faqs.length) {
    schema.mainEntity = faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: stripHtml(f.answer) },
    }));
  }

  return schema;
}

/** Build `about` Thing nodes from an article's entities/tags. */
function buildAboutEntities(article) {
  const entities = article.entities || {};
  const things = [];
  const add = (name, type) => {
    if (!name) return;
    things.push({ '@type': type, name: String(name) });
  };
  (entities.people || []).forEach((n) => add(n, 'Person'));
  (entities.organizations || []).forEach((n) => add(n, 'Organization'));
  (entities.locations || []).forEach((n) => add(n, 'Place'));
  if (!things.length) {
    (article.tags || []).slice(0, 6).forEach((t) => add(t, 'Thing'));
  }
  return things.length ? things : undefined;
}

/** Standalone FAQPage schema (when an article carries FAQs). */
export function faqSchema(faqs = []) {
  if (!Array.isArray(faqs) || !faqs.length) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: stripHtml(f.answer) },
    })),
  };
}

/** CollectionPage + ItemList for a category or author listing. */
export function collectionPageSchema({ name, description, url, items = [] }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name,
    description,
    url,
    isPartOf: { '@id': `${SITE_URL}/#website` },
    publisher: { '@id': `${SITE_URL}/#organization` },
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: articleUrl(item),
        name: item.title,
      })),
    },
  };
}

/** ItemList for the homepage (top stories). */
export function itemListSchema(items = [], { name = 'Latest News' } = {}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: articleUrl(item),
      name: item.title,
    })),
  };
}

/** LiveBlogPosting for the /live page. */
export function liveBlogSchema({ title, description, url, updates = [] }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'LiveBlogPosting',
    headline: title,
    description,
    url,
    coverageStartTime: toIso(updates[updates.length - 1]?.time) || toIso(new Date()),
    publisher: organizationSchema(),
    liveBlogUpdate: updates.map((u) => ({
      '@type': 'BlogPosting',
      headline: u.title,
      datePublished: toIso(u.time),
      articleBody: stripHtml(u.body || ''),
    })),
  };
}

/** Generic WebPage schema for static pages (about, contact, policies). */
export function webPageSchema({ name, description, url }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name,
    description,
    url,
    isPartOf: { '@id': `${SITE_URL}/#website` },
    publisher: { '@id': `${SITE_URL}/#organization` },
    inLanguage: 'en',
  };
}
