import { createJob } from '@/lib/services/jobs/jobService';

/**
 * Layer 1 — editorial/public-request-safe. Queues a job and returns; the
 * actual generation (Google Cloud TTS + Cloudinary upload, both of which
 * are slow and one of which costs real money per character) happens later
 * in the generic job worker. Mirrors articleNotificationQueue.js's shape —
 * a reader clicking "Listen" must never be blocked on how long generation
 * takes, the same reason publishing an article never blocks on
 * notification delivery.
 *
 * Priority 6: deliberately after every notification priority (1-4,
 * breaking>trending>published>newsletter), so a burst of "Listen" clicks
 * can never delay a time-sensitive push within a shared drain pass.
 */
const AUDIO_GENERATION_PRIORITY = 6;

export async function queueAudioGeneration(articleId) {
  return createJob({
    kind: 'audio_generation',
    priority: AUDIO_GENERATION_PRIORITY,
    articleId,
  });
}
