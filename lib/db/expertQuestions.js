import { getDbCollection } from './index';
import { COLLECTIONS } from '@/lib/constants/collections';

// Dedicated collection, not appended to `comments` — a question has one
// designated answerer and is category-scoped knowledge-base content, not
// article-scoped multi-participant discussion (see
// docs/mvp3-phase1-architecture.md's Ask the Expert record).
export function getExpertQuestionsCollection() {
  return getDbCollection(COLLECTIONS.EXPERT_QUESTIONS, [
    // The expert queue: pending questions, optionally filtered by category.
    { keys: { status: 1, category: 1, createdAt: -1 } },
    // "My questions" for a reader.
    { keys: { userId: 1, createdAt: -1 } },
  ]);
}
