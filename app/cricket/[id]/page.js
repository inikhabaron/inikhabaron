import { getMatchDetail } from '@/lib/services/cricket/cricketService';
import { MATCH_STATES } from '@/lib/services/cricket/cricketConstants';
import { formatMatchDateTime } from '@/lib/cricket/matchStatus';
import MatchDetailClient from './MatchDetailClient';

// Always live data — never statically generated or cached at the route level
// (the service's own Redis "fresh" tier is what actually absorbs traffic).
export const dynamic = 'force-dynamic';

// Minimal metadata for now — team names + current status. Full Open Graph /
// Twitter / SportsEvent structured data is a later pass (spec section 15),
// same as the rest of this module's phasing.
export async function generateMetadata({ params }) {
  const { id } = await params;
  const match = await getMatchDetail(id);

  if (!match?.teams?.length) {
    return { title: 'Live Cricket Score' };
  }

  const teamNames = match.teams.map((t) => t.name).join(' vs ');
  const title = match.name ? `${teamNames} — ${match.name}` : teamNames;

  // A not-yet-started match has no `status` text yet — the date/time/venue
  // is the useful thing to put in a search result for it instead of the
  // generic scorecard fallback.
  let description = match.status;
  if (!description && match.matchState === MATCH_STATES.UPCOMING) {
    const when = formatMatchDateTime(match.dateTimeGMT, false);
    description = when
      ? `${teamNames} starts ${when}${match.venue ? ` at ${match.venue}` : ''}.`
      : `Upcoming match: ${teamNames}.`;
  }

  return {
    title: `${title} | Live Cricket Score`,
    description: description || `Live score and scorecard for ${teamNames}.`,
  };
}

export default async function CricketMatchPage({ params }) {
  const { id } = await params;
  const initialMatch = await getMatchDetail(id);

  return <MatchDetailClient matchId={id} initialMatch={initialMatch} />;
}
