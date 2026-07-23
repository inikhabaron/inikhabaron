import { getDbCollection } from '@/lib/db/index';
import { COLLECTIONS } from '@/lib/constants/collections';

// Two compound indexes, each matching one real access pattern in
// promotionService.js exactly — rather than one index per field, which
// would leave Mongo to fall back on a collection scan for the filter/sort
// combinations actually used:
//   1. status + startDate + endDate — the public active-list filter
//      (status === 'active' AND now within [startDate, endDate]).
//   2. isFeatured + priority + eventDate — the sort order both the admin
//      list and the public active list use (featured first, then
//      priority, then soonest event).
export async function getPromotionsCollection() {
  return getDbCollection(COLLECTIONS.PROMOTIONS, [
    { keys: { status: 1, startDate: 1, endDate: 1 } },
    { keys: { isFeatured: -1, priority: 1, eventDate: 1 } },
  ]);
}
