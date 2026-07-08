import { COLLECTIONS } from '@/lib/constants/collections';
import { getDbCollection } from './index';

const reportIndexes = [
  {
    keys: {
      commentId: 1,
      userId: 1,
    },
    options: {
      unique: true,
      name: 'unique_comment_report',
    },
  },
  {
    keys: {
      commentId: 1,
    },
    options: {
      name: 'comment_reports',
    },
  },
];

export function getCommentReportsCollection() {
  return getDbCollection(
    COLLECTIONS.COMMENT_REPORTS,
    reportIndexes
  );
}