import { success, failure } from '@/lib/api/response';
import { logApiError } from '@/lib/api/errors';
import { getQuestionById } from '@/lib/services/expert/expertQuestionService';
import { getAnswerForQuestion } from '@/lib/services/expert/expertAnswerService';
import { getCollection } from '@/lib/mongodb';
import { COLLECTIONS } from '@/lib/constants/collections';

/** GET /api/expert-questions/[id] — a single published Q&A (deep-link target for the answer-notification). */
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const question = await getQuestionById(id);

    if (!question || question.status !== 'published') {
      return failure('Question not found', 404);
    }

    const answer = await getAnswerForQuestion(id);
    if (!answer || answer.status !== 'published') {
      return failure('Question not found', 404);
    }

    const usersCollection = await getCollection(COLLECTIONS.USERS);
    const expert = await usersCollection.findOne(
      { id: answer.expertId },
      { projection: { id: 1, name: 1, avatar: 1 } },
    );

    return success({
      id: question.id,
      question: question.question,
      category: question.category,
      createdAt: question.createdAt,
      answer: answer.answer,
      answeredAt: answer.publishedAt,
      expert: expert || null,
    });
  } catch (error) {
    logApiError('GET /api/expert-questions/[id]', error);
    return failure('Unable to load question', 500);
  }
}
