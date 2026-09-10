import { getDbCollection } from './index';
import { COLLECTIONS } from '@/lib/constants/collections';

// Kept separate from expert_questions (rather than embedded) per the
// approved schema — one question has exactly one answer today, but the
// normalized shape avoids a migration if that ever needs to change.
export function getExpertAnswersCollection() {
  return getDbCollection(COLLECTIONS.EXPERT_ANSWERS, [
    { keys: { questionId: 1 }, options: { unique: true } },
  ]);
}
