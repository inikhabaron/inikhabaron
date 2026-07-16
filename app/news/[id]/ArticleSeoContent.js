/**
 * Server-rendered semantic article content for search engines and AI answer
 * engines (Google AI Overviews, ChatGPT, Perplexity, Gemini, Bing Copilot).
 *
 * This is a SERVER component: it is part of the initial HTML, so crawlers that
 * do not execute JavaScript still receive the full, structured story — headline,
 * byline, dates, a summary block, key takeaways, the article body, named
 * entities and FAQs. It is visually hidden (screen-reader technique) because the
 * interactive `NewsClient` renders the styled UI; this layer exists purely to
 * guarantee machine-readable, entity-rich content.
 */
import { SITE, articleUrl, authorUrl, categoryUrl } from '@/lib/seo/config';
import { stripHtml, truncate } from '@/lib/seo/utils';

// Accessible visually-hidden style: stays in the DOM & readable by crawlers and
// screen readers, but takes no visual space and never overlaps the UI.
const srOnly = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0,0,0,0)',
  whiteSpace: 'nowrap',
  border: 0,
};

/** Derive up to 5 "key takeaway" sentences from the body as an AI summary aid. */
function keyTakeaways(article) {
  const text = stripHtml(article.content || article.excerpt || '');
  if (!text) return [];
  const sentences = text
    .split(/(?<=[.!?।])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 40 && s.length < 240);
  return sentences.slice(0, 5);
}

export default function ArticleSeoContent({ article, categoryLabel, faqs = [] }) {
  if (!article) return null;

  const published = article.publishedAt || article.createdAt;
  const modified = article.updatedAt || published;
  const authorName = article.authorName || article.author || 'Editorial Team';
  const summary = truncate(
    stripHtml(article.seoDescription || article.excerpt || article.content || ''),
    320,
  );
  const takeaways = keyTakeaways(article);
  const entities = article.entities || {};
  const bodyText = stripHtml(article.content || '');

  return (
    <article
      style={srOnly}
      aria-hidden="false"
      itemScope
      itemType="https://schema.org/NewsArticle"
      data-seo="article-content"
    >
      <header>
        <h1 itemProp="headline">{article.title}</h1>
        <p>
          <span>Category: </span>
          <a href={categoryUrl(article.category)}>{categoryLabel}</a>
        </p>
        <address>
          By{' '}
          {article.authorId ? (
            <a href={authorUrl(article.authorId)} itemProp="author">{authorName}</a>
          ) : (
            <span itemProp="author">{authorName}</span>
          )}
          {', '}
          <span>{SITE.name}</span>
        </address>
        {published && (
          <time itemProp="datePublished" dateTime={new Date(published).toISOString()}>
            Published: {new Date(published).toISOString()}
          </time>
        )}
        {modified && (
          <time itemProp="dateModified" dateTime={new Date(modified).toISOString()}>
            {' '}Updated: {new Date(modified).toISOString()}
          </time>
        )}
      </header>

      {summary && (
        <section className="article-summary" aria-label="Summary">
          <h2>Summary</h2>
          <p>{summary}</p>
        </section>
      )}

      {takeaways.length > 0 && (
        <section aria-label="Key takeaways">
          <h2>Key Takeaways</h2>
          <ul>
            {takeaways.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </section>
      )}

      {/* Full body text — guarantees crawlable/LLM-ingestible article content. */}
      {bodyText && (
        <section className="article-body" aria-label="Full article" itemProp="articleBody">
          <h2>Full Story</h2>
          <p>{bodyText}</p>
        </section>
      )}

      {/* Named entities help AI search build an accurate topic/entity graph. */}
      {(entities.people?.length || entities.organizations?.length || entities.locations?.length) ? (
        <section aria-label="Entities mentioned">
          <h2>In this story</h2>
          {entities.people?.length ? <p>People mentioned: {entities.people.join(', ')}</p> : null}
          {entities.organizations?.length ? <p>Organizations mentioned: {entities.organizations.join(', ')}</p> : null}
          {entities.locations?.length ? <p>Locations: {entities.locations.join(', ')}</p> : null}
        </section>
      ) : null}

      {Array.isArray(article.tags) && article.tags.length > 0 && (
        <section aria-label="Related topics">
          <h2>Related Topics</h2>
          <ul>
            {article.tags.map((tag, i) => (
              <li key={i}>{tag}</li>
            ))}
          </ul>
        </section>
      )}

      {Array.isArray(faqs) && faqs.length > 0 && (
        <section aria-label="Frequently asked questions">
          <h2>Frequently Asked Questions</h2>
          <dl>
            {faqs.map((f, i) => (
              <div key={i}>
                <dt>{f.question}</dt>
                <dd>{stripHtml(f.answer)}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      <footer>
        <a href={articleUrl(article)}>Read the full story on {SITE.name}</a>
      </footer>
    </article>
  );
}
