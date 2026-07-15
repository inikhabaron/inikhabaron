/**
 * Server-rendered article grid used by category and author listing pages.
 * Every card is a real <a href> so crawlers get strong internal links and the
 * link graph is fully server-rendered (no JS required to discover stories).
 */
import { SITE } from '@/lib/seo/config';
import { stripHtml, truncate } from '@/lib/seo/utils';

function formatDate(d) {
  if (!d) return '';
  try {
    return new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

export default function ArticleGrid({ articles = [] }) {
  if (!articles.length) {
    return <p style={{ color: '#6B7280' }}>No stories yet. Please check back soon.</p>;
  }
  return (
    <ul
      style={{
        listStyle: 'none',
        padding: 0,
        margin: 0,
        display: 'grid',
        gap: '20px',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
      }}
    >
      {articles.map((a) => (
        <li key={a.id} style={{ border: '1px solid #E8EAED', borderRadius: '12px', overflow: 'hidden', background: '#fff' }}>
          <a href={`/news/${a.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
            <img
              src={a.featuredImage || SITE.defaultImage}
              alt={a.title}
              width={400}
              height={220}
              loading="lazy"
              style={{ width: '100%', height: '180px', objectFit: 'cover' }}
            />
            <div style={{ padding: '14px' }}>
              <h2 style={{ fontSize: '16px', lineHeight: 1.4, margin: '0 0 8px', color: '#111827' }}>{a.title}</h2>
              <p style={{ fontSize: '13px', color: '#4B5563', margin: '0 0 8px' }}>
                {truncate(stripHtml(a.excerpt || a.content || ''), 120)}
              </p>
              <time dateTime={a.publishedAt} style={{ fontSize: '12px', color: '#8A8F98' }}>
                {formatDate(a.publishedAt)}
              </time>
            </div>
          </a>
        </li>
      ))}
    </ul>
  );
}
