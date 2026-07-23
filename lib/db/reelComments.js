import { COLLECTIONS } from '@/lib/constants/collections';
import { getDbCollection } from './index';

const reelCommentIndexes = [
  {
    keys: { reelId: 1, status: 1, createdAt: -1 },
    options: { name: 'reel_status_created' },
  },
  {
    keys: { userId: 1 },
    options: { name: 'user_reel_comments' },
  },
  {
    keys: { parentCommentId: 1 },
    options: { name: 'reel_parent_comment' },
  },
];

export function getReelCommentsCollection() {
  return getDbCollection(
    COLLECTIONS.REEL_COMMENTS,
    reelCommentIndexes
  );
}
