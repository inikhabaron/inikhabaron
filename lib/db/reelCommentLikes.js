import { COLLECTIONS } from '@/lib/constants/collections';
import { getDbCollection } from './index';

const reelCommentLikeIndexes = [
  {
    keys: { userId: 1, commentId: 1 },
    options: { unique: true, name: 'unique_reel_comment_like' },
  },
  {
    keys: { commentId: 1 },
    options: { name: 'reel_comment_lookup' },
  },
];

export function getReelCommentLikesCollection() {
  return getDbCollection(
    COLLECTIONS.REEL_COMMENT_LIKES,
    reelCommentLikeIndexes
  );
}
