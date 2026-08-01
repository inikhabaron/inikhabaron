'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Newspaper } from 'lucide-react';
import { CRICKET_SEARCH_TERMS } from '@/lib/cricket/newsRelevance';
import { event as trackEvent } from '@/lib/gtag';

// News → Cricket direction of the integration: published articles relevant
// to cricket, via the existing full-text search on /api/news — no new
// backend endpoint, no stored link between an article and a match/section.
// Two call shapes:
//   - with a `match`: below that match's scorecard, biased toward its own
//     team names (app/cricket/[id]/MatchDetailClient.jsx).
//   - without one: a generic "Related Cricket News" section on the /cricket
//     hub page (components/cricket/CricketSections.jsx) — falls back to
//     CRICKET_SEARCH_TERMS alone.
// Silent no-op (renders nothing) when nothing relevant is published yet,
// same as every other graceful-degrade surface in this module.
export default function RelatedCricketNews({ match, dark, selectedLanguage }) {
  const router = useRouter();
  const isHindi = selectedLanguage === 'hi';
  const [articles, setArticles] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const teamNames = (match?.teams || []).map((t) => t.name).filter(Boolean).join(' ');
    const query = `${teamNames} ${CRICKET_SEARCH_TERMS}`.trim();

    fetch(`/api/news?search=${encodeURIComponent(query)}&limit=6`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => { if (!cancelled) setArticles(Array.isArray(data.news) ? data.news : []); })
      .catch((error) => { console.error(error); if (!cancelled) setArticles([]); });

    return () => { cancelled = true; };
  }, [match?.id]);

  if (!articles || !articles.length) return null;

  const T1 = dark ? '#E8ECF0' : '#111827';
  const T3 = dark ? '#9BA5B4' : '#6B7280';
  const surface = dark ? '#161B27' : '#FFFFFF';
  const bdr = dark ? '#252E40' : '#E8EAED';

  return (
    <div style={{ borderRadius: 16, background: surface, border: `1px solid ${bdr}`, padding: 22 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <Newspaper size={17} color={T1} aria-hidden="true" />
        <h2 style={{ fontSize: 17, fontWeight: 800, color: T1, margin: 0 }}>
          {isHindi ? 'संबंधित क्रिकेट समाचार' : 'Related Cricket News'}
        </h2>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
        {articles.map((article) => (
          <button
            key={article.id}
            type="button"
            onClick={() => {
              trackEvent({ action: 'related_news_click', category: 'cricket_match', label: match?.id || 'unknown' });
              router.push(`/news/${article.id}`);
            }}
            style={{ textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}
          >
            {article.featuredImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={article.featuredImage} alt="" style={{ width: '100%', height: 110, objectFit: 'cover', borderRadius: 10 }} />
            )}
            <span style={{ fontSize: 13, fontWeight: 700, color: T1, lineHeight: 1.4 }}>{article.title}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
