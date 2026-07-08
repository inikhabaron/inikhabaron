import { COLLECTIONS } from '@/lib/constants/collections';
import { getDbCollection } from './index';

const commentIndexes = [
  {
    keys: { articleId: 1, status: 1 },
    options: {
      name: 'article_status',
    },
  },
  {
    keys: { parentCommentId: 1 },
    options: {
      name: 'parent_comment',
    },
  },
  {
    keys: { userId: 1 },
    options: {
      name: 'user_comments',
    },
  },
  {
    keys: { createdAt: -1 },
    options: {
      name: 'created_desc',
    },
  },
];

export function getCommentsCollection() {
  return getDbCollection(
    COLLECTIONS.COMMENTS,
    commentIndexes
  );
}