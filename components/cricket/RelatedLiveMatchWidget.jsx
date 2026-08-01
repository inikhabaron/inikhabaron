'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Radio } from 'lucide-react';
import { isCricketRelatedArticle, articleMentionsTeams } from '@/lib/cricket/newsRelevance';
import { MATCH_STATES } from '@/lib/services/cricket/cricketConstants';
import { event as trackEvent } from '@/lib/gtag';
import MatchScoreCard from './MatchScoreCard';

// Cricket → News direction of the integration: inside an article that reads
// as cricket-related (category/tags/keywords — see lib/cricket/newsRelevance),
// show the specific live match it's about, if any. Deliberately does *not*
// fetch anything for the other ~99% of articles — `isCricketRelatedArticle`
// is a synchronous check on fields the article already has, so a non-cricket
// story never even calls the matches endpoint.
export default function RelatedLiveMatchWidget({ article, dark, selectedLanguage }) {
  const router = useRouter();
  const isHindi = selectedLanguage === 'hi';
  const relevant = isCricketRelatedArticle(article);
  const [match, setMatch] = useState(null);

  useEffect(() => {
    if (!relevant) return undefined;
    let cancelled = false;

    fetch('/api/cricket/matches', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled || !Array.isArray(data.matches)) return;
        const live = data.matches.filter((m) => m.matchState === MATCH_STATES.LIVE);
        const found = live.find((m) => articleMentionsTeams(article, m.teams.map((t) => t.name)));
        setMatch(found || null);
      })
      .catch((error) => console.error(error));

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [relevant, article?.id]);

  if (!relevant || !match) return null;

  const T3 = dark ? '#9BA5B4' : '#6B7280';

  // maxWidth rather than a full-bleed block: inside a ~900px article column
  // an unconstrained card put the score ~700px from the team name. A score
  // card only needs card width, so it's capped and left-aligned with the
  // surrounding prose.
  return (
    <div style={{ margin: '18px 0', maxWidth: 420 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, fontSize: 12, fontWeight: 700, color: T3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        <Radio size={13} aria-hidden="true" />
        {isHindi ? 'संबंधित लाइव मैच' : 'Related Live Match'}
      </div>
      <MatchScoreCard
        match={match}
        dark={dark}
        isHindi={isHindi}
        compact
        onClick={() => {
          trackEvent({ action: 'related_match_click', category: 'cricket', label: article?.id || 'unknown' });
          router.push(`/cricket/${match.id}`);
        }}
      />
    </div>
  );
}
