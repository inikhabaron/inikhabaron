import { COLLECTIONS } from '@/lib/constants/collections';
import { getDbCollection } from './index';

const reelReportIndexes = [
  {
    keys: { reelId: 1, userId: 1 },
    options: { unique: true, name: 'unique_reel_report' },
  },
  {
    keys: { reelId: 1 },
    options: { name: 'reel_reports_lookup' },
  },
];

export function getReelReportsCollection() {
  return getDbCollection(
    COLLECTIONS.REEL_REPORTS,
    reelReportIndexes
  );
}
