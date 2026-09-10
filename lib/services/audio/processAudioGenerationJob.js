import { getCollection } from '@/lib/mongodb';
import { COLLECTIONS } from '@/lib/constants/collections';
import { stripHtml } from '@/lib/seo/utils';
import { synthesizeSpeech } from './ttsService';
import { uploadAudioBuffer } from './audioStorageService';
import { markAudioReady, markAudioFailed } from './audioArticleService';

/**
 * The audio_generation job handler — registered into the generic job
 * worker's dispatch table (see dispatchNotificationJob.js). Lives in its
 * own module, the same reason pushSenderService.js is separate from the
 * generic dispatcher: a handler's heavy/vendor-specific dependencies
 * (Google Cloud TTS here, Firebase there) should never be importable from
 * editorial code, only from the worker that dispatches to them.
 *
 * synthesizeSpeech() throws until Phase 3A.3 (Google Cloud TTS
 * integration) lands, so this handler currently always fails — that's
 * intentional per the approved build order, not a bug. It goes through the
 * exact same retry-then-fail path every other job kind does, and
 * markAudioFailed() surfaces the reason on the article so an admin/reader
 * doesn't see a silent forever-pending state.
 */
export async function processAudioGenerationJob(job) {
  const news = await getCollection(COLLECTIONS.NEWS);
  const article = await news.findOne(
    { id: job.articleId },
    { projection: { _id: 0, id: 1, content: 1, excerpt: 1, status: 1 } }
  );

  if (!article) {
    throw new Error(`Article ${job.articleId} not found`);
  }

  try {
    const text = stripHtml(article.content || article.excerpt || '');
    if (!text) throw new Error('Article has no content to narrate');

    const audioBuffer = await synthesizeSpeech(text);
    const upload = await uploadAudioBuffer(audioBuffer, { publicId: article.id });

    await markAudioReady(article.id, { url: upload.url, durationSeconds: upload.durationSeconds });

    return { status: 'ready', stats: { durationSeconds: upload.durationSeconds } };
  } catch (error) {
    // Reflected onto the article immediately (not just the job) so a reader
    // polling GET /api/news/[id]/audio sees "failed" rather than "pending"
    // forever while the job still has retries left.
    await markAudioFailed(article.id, error.message);
    throw error;
  }
}
