import { v4 as uuidv4 } from 'uuid';
import { getExpertAnswersCollection } from '@/lib/db/expertAnswers';
import { getExpertQuestionsCollection } from '@/lib/db/expertQuestions';
import { queueExpertAnswerNotification } from '@/lib/services/notifications/articleNotificationQueue';

/**
 * Answering a question is what moves it from pending to published — no
 * separate "publish the question" step, since a question with no answer
 * has nothing to show in the public knowledge base anyway.
 */
export async function submitAnswer(expertId, questionId, answerText) {
  const trimmed = String(answerText || '').trim();
  if (!trimmed) {
    return { success: false, reason: 'EMPTY_ANSWER' };
  }

  const questionsCollection = await getExpertQuestionsCollection();
  const question = await questionsCollection.findOne({ id: questionId });

  if (!question) {
    return { success: false, reason: 'QUESTION_NOT_FOUND' };
  }
  if (question.status === 'hidden') {
    return { success: false, reason: 'QUESTION_HIDDEN' };
  }

  const answersCollection = await getExpertAnswersCollection();
  const existing = await answersCollection.findOne({ questionId });
  if (existing) {
    return { success: false, reason: 'ALREADY_ANSWERED' };
  }

  const now = new Date();
  const answer = {
    id: uuidv4(),
    questionId,
    expertId,
    answer: trimmed,
    status: 'published',
    createdAt: now,
    updatedAt: now,
    publishedAt: now,
  };

  await answersCollection.insertOne(answer);
  await questionsCollection.updateOne(
    { id: questionId },
    { $set: { status: 'published', updatedAt: now } },
  );

  await queueExpertAnswerNotification(question, answer);

  return { success: true, answer };
}

export async function getAnswerForQuestion(questionId) {
  const collection = await getExpertAnswersCollection();
  return collection.findOne({ questionId });
}

/** Admin moderation: hide a published answer without touching the question's own status. */
export async function hideAnswer(questionId) {
  const collection = await getExpertAnswersCollection();
  const result = await collection.updateOne(
    { questionId },
    { $set: { status: 'hidden', updatedAt: new Date() } },
  );
  return { success: result.matchedCount > 0 };
}
