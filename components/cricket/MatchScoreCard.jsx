'use client';

import { MapPin, Clock, Trophy } from 'lucide-react';
import { matchStateLabel, matchStateColors, formatMatchDateTime, msUntilStart, COUNTDOWN_WINDOW_MS } from '@/lib/cricket/matchStatus';
import { MATCH_STATES } from '@/lib/services/cricket/cricketConstants';
import MatchCountdown from './MatchCountdown';
import styles from './MatchScoreCard.module.css';

function formatScore(score) {
  if (!score || score.runs == null) return null;
  const overs = score.overs != null ? ` (${score.overs})` : '';
  const wickets = score.wickets != null ? `/${score.wickets}` : '';
  return `${score.runs}${wickets}${overs}`;
}

// One score card for a single match — used by the live list (/cricket), the
// homepage widget, and (compact=false) any future dedicated section. Purely
// presentational: takes an already-normalized match object from
// cricketService and a click handler, holds no fetching/polling of its own.
export default function MatchScoreCard({ match, dark, isHindi, compact = false, onClick }) {
  const T1 = dark ? '#E8ECF0' : '#111827';
  const T2 = dark ? '#9BA5B4' : '#4B5563';
  const T3 = dark ? '#9BA5B4' : '#6B7280';
  const surface = dark ? '#161B27' : '#FFFFFF';
  const bdr = dark ? '#252E40' : '#E8EAED';
  const isLive = match.matchState === MATCH_STATES.LIVE;
  const stateColors = matchStateColors(match.matchState, dark);
  const teams = Array.isArray(match.teams) ? match.teams : [];
  // "Yet to bat" is only true of a match still to come or in progress. On a
  // finished match a missing score means the feed didn't report that side's
  // innings, not that they never batted — so it reads as a gap, not a claim.
  const noScoreLabel = match.matchState === MATCH_STATES.COMPLETED
    ? '—'
    : (isHindi ? 'बल्लेबाजी बाकी' : 'Yet to bat');

  const isUpcoming = match.matchState === MATCH_STATES.UPCOMING;
  const remaining = isUpcoming ? msUntilStart(match.dateTimeGMT) : null;
  const showCountdown = remaining != null && remaining <= COUNTDOWN_WINDOW_MS;

  return (
    <button
      type="button"
      className={styles.card}
      style={{ background: surface, border: `1px solid ${isLive ? '#ef4444' : bdr}` }}
      onClick={onClick}
    >
      <div className={styles.topRow}>
        <div className={styles.badges}>
          {match.matchType && (
            <span className={styles.matchType} style={{ background: dark ? 'rgba(255,255,255,0.06)' : '#F3F4F6', color: T2 }}>
              {match.matchType}
            </span>
          )}
          <span
            className={styles.statusBadge}
            style={{ background: stateColors.bg, color: stateColors.color }}
          >
            {matchStateLabel(match.matchState, isHindi)}
          </span>
        </div>
        {!compact && match.name && (
          <span className={styles.seriesName} style={{ color: T3 }}>{match.name}</span>
        )}
      </div>

      {teams.map((team, index) => {
        const scoreText = formatScore(team.score);
        // Only meaningful once the match has actually ended — matchWinner
        // isn't populated beforehand, so this never fires for a live/
        // upcoming card.
        const isWinner = match.matchState === MATCH_STATES.COMPLETED && match.matchWinner && team.name
          && team.name.trim().toLowerCase() === match.matchWinner.trim().toLowerCase();
        return (
          // Indexed key: CricAPI has been seen returning a nameless side, so
          // team name isn't reliably unique (two blanks would collide).
          <div className={styles.teamRow} key={`${team.name || 'unknown'}-${index}`}>
            <span className={styles.teamIdentity}>
              {team.image && (
                // Plain <img>, not next/image — CricAPI serves logos from a
                // CDN host that isn't (and shouldn't need to be) allowlisted
                // in next.config.js just for this.
                <img src={team.image} alt="" className={styles.teamLogo} />
              )}
              <span className={styles.teamName} style={{ color: team.name ? T1 : T3, fontWeight: isWinner ? 800 : 700 }}>
                {team.name || (isHindi ? 'टीम घोषित नहीं' : 'Team not announced')}
              </span>
              {isWinner && <Trophy size={12} color="#d97706" aria-hidden="true" style={{ flexShrink: 0 }} />}
            </span>
            <span className={styles.teamScore} style={{ color: scoreText ? T1 : T3 }}>
              {scoreText || noScoreLabel}
            </span>
          </div>
        );
      })}

      {match.status && (
        <div className={styles.statusLine} style={{ color: T2 }}>{match.status}</div>
      )}

      {isUpcoming && (
        <div className={styles.metaRow} style={{ color: T3 }}>
          <Clock size={11} aria-hidden="true" />
          <span>{formatMatchDateTime(match.dateTimeGMT, isHindi) || (isHindi ? 'समय की पुष्टि नहीं' : 'Time to be confirmed')}</span>
        </div>
      )}

      {showCountdown && (
        <div className={styles.metaRow} style={{ color: stateColors.color, fontWeight: 700 }}>
          <MatchCountdown dateTimeGMT={match.dateTimeGMT} isHindi={isHindi} showIcon />
        </div>
      )}

      {!compact && match.venue && (
        <div className={styles.metaRow} style={{ color: T3 }}>
          <MapPin size={11} aria-hidden="true" />
          <span>{match.venue}</span>
        </div>
      )}

      {match.stale && (
        <div className={styles.staleNote}>
          {isHindi ? 'नवीनतम डेटा उपलब्ध नहीं — अंतिम ज्ञात स्कोर दिखाया गया' : 'Live refresh failed — showing last known score'}
        </div>
      )}
    </button>
  );
}
