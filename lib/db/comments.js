import { COLLECTIONS } from '@/lib/constants/collections';
import { getDbCollection } from './index';

// parentCommentId is intentionally not indexed here — lib/db/ensureIndexes.js
// already creates it (as parentCommentId_1) once per process at startup.
// Defining it in both places under different names is what MongoDB rejects
// with IndexOptionsConflict, which previously broke every comments route.
const commentIndexes = [
  {
    keys: { articleId: 1, status: 1 },
    options: {
      name: 'article_status',
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