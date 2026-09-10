import { requireUser } from '@/lib/auth/user/requireUser';
import { success, failure } from '@/lib/api/response';
import { logApiError } from '@/lib/api/errors';
import { getCollection } from '@/lib/mongodb';
import { submitQuestion, getPublishedQuestions } from '@/lib/services/expert/expertQuestionService';

const MAX_QUESTION_LENGTH = 500;

/**
 * POST /api/expert-questions — submit a question to the expert queue.
 * Body: { question: string, category: string }
 */
export async function POST(request) {
  try {
    const auth = await requireUser();
    if (!auth.success) return auth.response;

    const { question, category } = await request.json().catch(() => ({}));

    if (typeof question !== 'string' || !question.trim()) {
      return failure('question is required', 400);
    }
    if (question.trim().length > MAX_QUESTION_LENGTH) {
      return failure(`question must be ${MAX_QUESTION_LENGTH} characters or fewer`, 400);
    }
    if (typeof category !== 'string' || !category.trim()) {
      return failure('category is required', 400);
    }

    const categoriesCollection = await getCollection('categories');
    const validCategory = await categoriesCollection.findOne({ slug: category, isActive: true }, { projection: { _id: 1 } });
    if (!validCategory) {
      return failure('Invalid category', 400);
    }

    const result = await submitQuestion(auth.user.id, { question, category });
    if (!result.success) {
      return failure('Unable to submit question', 400);
    }

    return success(result.question, 'Question submitted', undefined, 201);
  } catch (error) {
    logApiError('POST /api/expert-questions', error);
    return failure('Unable to submit question', 500);
  }
}

/**
 * GET /api/expert-questions?category=&page=&limit= — the public knowledge
 * base: published questions with their answer, newest-answered first.
 */
export async function GET(request) {
  try {
    const url = new URL(request.url);
    const category = url.searchParams.get('category') || undefined;
    const page = Math.max(parseInt(url.searchParams.get('page') || '1', 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') || '20', 10) || 20, 1), 50);

    const result = await getPublishedQuestions({ category, page, limit });
    return success(result);
  } catch (error) {
    logApiError('GET /api/expert-questions', error);
    return failure('Unable to load questions', 500);
  }
}
