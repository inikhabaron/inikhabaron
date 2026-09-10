import { getCollection } from '@/lib/mongodb';
import { COLLECTIONS } from '@/lib/constants/collections';

/**
 * The public-facing half of an article's audio state, stored directly on
 * the `news` document (`audio: {status, url, durationSeconds, generatedAt,
 * error}`) — a derived 1:1 property of an article, same shape as
 * `featuredImage`, not a candidate for its own collection (see
 * docs/mvp3-phase1-architecture.md, Audio News). Readers and the public API
 * only ever need this; the `audio_generation` job's own internal status
 * (pending/processing/failed/attempts) is a separate, admin-only concern
 * handled by lib/services/jobs/jobService.js.
 */

export async function getAudioStatus(articleId) {
  const news = await getCollection(COLLECTIONS.NEWS);
  const article = await news.findOne({ id: articleId }, { projection: { _id: 0, id: 1, status: 1, audio: 1 } });
  if (!article) return null;
  return { article, audio: article.audio || { status: 'none' } };
}

export async function markAudioPending(articleId) {
  const news = await getCollection(COLLECTIONS.NEWS);
  await news.updateOne(
    { id: articleId },
    { $set: { audio: { status: 'pending', url: null, durationSeconds: null, generatedAt: null, error: null } } }
  );
}

export async function markAudioReady(articleId, { url, durationSeconds }) {
  const news = await getCollection(COLLECTIONS.NEWS);
  await news.updateOne(
    { id: articleId },
    { $set: { audio: { status: 'ready', url, durationSeconds: durationSeconds ?? null, generatedAt: new Date(), error: null } } }
  );
}

export async function markAudioFailed(articleId, error) {
  const news = await getCollection(COLLECTIONS.NEWS);
  await news.updateOne(
    { id: articleId },
    { $set: { 'audio.status': 'failed', 'audio.error': error } }
  );
}
