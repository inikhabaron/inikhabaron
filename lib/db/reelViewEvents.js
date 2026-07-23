import { COLLECTIONS } from '@/lib/constants/collections';
import { getDbCollection } from './index';

// Dedup ledger for the 'view' analytics event — one counted view per
// {reelId, viewerKey, windowBucket}. The TTL index reaps rows well after the
// dedup window itself has passed (see VIEW_DEDUP_WINDOW_MS in reelService.js)
// so this never grows unbounded.
const reelViewEventIndexes = [
  {
    keys: { reelId: 1, viewerKey: 1, windowBucket: 1 },
    options: { unique: true, name: 'unique_reel_view_window' },
  },
  {
    keys: { createdAt: 1 },
    options: { expireAfterSeconds: 60 * 60 * 24, name: 'reel_view_events_ttl' },
  },
];

export function getReelViewEventsCollection() {
  return getDbCollection(
    COLLECTIONS.REEL_VIEW_EVENTS,
    reelViewEventIndexes
  );
}
