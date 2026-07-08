import { COLLECTIONS } from '@/lib/constants/collections';
import { getDbCollection } from './index';

const commentLikeIndexes = [
  {
    keys: {
      userId: 1,
      commentId: 1,
    },
    options: {
      unique: true,
      name: 'unique_comment_like',
    },
  },
  {
    keys: {
      commentId: 1,
    },
    options: {
      name: 'comment_lookup',
    },
  },
];

export function getCommentLikesCollection() {
  return getDbCollection(
    COLLECTIONS.COMMENT_LIKES,
    commentLikeIndexes
  );
}