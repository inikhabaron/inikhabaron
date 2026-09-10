import { v4 as uuidv4 } from 'uuid';
import { getExpertQuestionsCollection } from '@/lib/db/expertQuestions';
import { getExpertAnswersCollection } from '@/lib/db/expertAnswers';
import { getCollection } from '@/lib/mongodb';
import { COLLECTIONS } from '@/lib/constants/collections';

export const QUESTION_STATUSES = ['pending', 'published', 'hidden'];

const MAX_QUESTION_LENGTH = 500;

export async function submitQuestion(userId, { question, category }) {
  const trimmed = String(question || '').trim();
  if (!trimmed) {
    return { success: false, reason: 'EMPTY_QUESTION' };
  }
  if (!category) {
    return { success: false, reason: 'CATEGORY_REQUIRED' };
  }

  const collection = await getExpertQuestionsCollection();
  const now = new Date();
  const doc = {
    id: uuidv4(),
    userId,
    question: trimmed.slice(0, MAX_QUESTION_LENGTH),
    category,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
  };

  await collection.insertOne(doc);
  return { success: true, question: doc };
}

/** The expert queue: unanswered questions, optionally filtered by category. */
export async function getPendingQuestions({ category, page = 1, limit = 20 } = {}) {
  const collection = await getExpertQuestionsCollection();
  const query = { status: 'pending' };
  if (category) query.category = category;

  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    collection.find(query).sort({ createdAt: 1 }).skip(skip).limit(limit).toArray(),
    collection.countDocuments(query),
  ]);

  return { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
}

/**
 * The public knowledge base: published questions joined with their
 * published answer and the answering expert's display info. A question
 * whose answer has since been hidden (but the question itself hasn't) is
 * excluded here rather than needing a cascading status update on the
 * question when an answer is moderated.
 */
export async function getPublishedQuestions({ category, page = 1, limit = 20 } = {}) {
  const questionsCollection = await getExpertQuestionsCollection();
  const answersCollection = await getExpertAnswersCollection();

  const query = { status: 'published' };
  if (category) query.category = category;

  const skip = (page - 1) * limit;
  const candidates = await questionsCollection
    .find(query)
    .sort({ updatedAt: -1 })
    .skip(skip)
    .limit(limit)
    .toArray();

  if (!candidates.length) {
    return { items: [], pagination: { page, limit, total: 0, pages: 0 } };
  }

  const questionIds = candidates.map((q) => q.id);
  const answers = await answersCollection
    .find({ questionId: { $in: questionIds }, status: 'published' })
    .toArray();
  const answerMap = new Map(answers.map((a) => [a.questionId, a]));

  const withAnswers = candidates
    .map((q) => ({ question: q, answer: answerMap.get(q.id) }))
    .filter((row) => row.answer);

  const expertIds = [...new Set(withAnswers.map((row) => row.answer.expertId))];
  const usersCollection = await getCollection(COLLECTIONS.USERS);
  const experts = expertIds.length
    ? await usersCollection.find({ id: { $in: expertIds } }).project({ id: 1, name: 1, avatar: 1 }).toArray()
    : [];
  const expertMap = new Map(experts.map((e) => [e.id, e]));

  // Total reflects the same "has a published answer" filter as the page
  // above, not just questions.status — otherwise the count could exceed
  // what a reader ever sees across pages.
  const total = await questionsCollection.countDocuments(query);

  return {
    items: withAnswers.map(({ question, answer }) => ({
      id: question.id,
      question: question.question,
      category: question.category,
      createdAt: question.createdAt,
      answer: answer.answer,
      answeredAt: answer.publishedAt,
      expert: expertMap.get(answer.expertId) || null,
    })),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
}

export async function getQuestionById(id) {
  const collection = await getExpertQuestionsCollection();
  return collection.findOne({ id });
}

/** Published question ids, for the sitemap. */
export async function getPublishedQuestionIdsForSitemap() {
  const collection = await getExpertQuestionsCollection();
  const docs = await collection.find({ status: 'published' }, { projection: { _id: 0, id: 1, updatedAt: 1 } }).toArray();
  return docs;
}

/** Admin moderation: remove a question (spam/inappropriate) from both the queue and the public list. */
export async function hideQuestion(id) {
  const collection = await getExpertQuestionsCollection();
  const result = await collection.updateOne(
    { id },
    { $set: { status: 'hidden', updatedAt: new Date() } },
  );
  return { success: result.matchedCount > 0 };
}
