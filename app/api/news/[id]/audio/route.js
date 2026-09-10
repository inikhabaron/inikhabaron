import { json, preflight } from '@/lib/api/cors';
import { getAudioStatus, markAudioPending } from '@/lib/services/audio/audioArticleService';
import { queueAudioGeneration } from '@/lib/services/audio/audioGenerationQueue';

export const dynamic = 'force-dynamic';
export const OPTIONS = preflight;

/**
 * GET /api/news/[id]/audio — poll the current audio state. Public, no auth:
 * "Listen to Article" is a shared, article-level resource (one generated
 * file serves every reader), not a personal one like a bookmark or follow.
 */
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const result = await getAudioStatus(id);
    if (!result) return json({ error: 'Article not found' }, { status: 404 });
    return json({ audio: result.audio });
  } catch (error) {
    console.error('GET /api/news/[id]/audio error:', error);
    return json({ error: 'Failed to load audio status' }, { status: 500 });
  }
}

/**
 * POST /api/news/[id]/audio — idempotent "ensure this article has audio, or
 * is on its way to having some." A reader's first "Listen" click lands
 * here: if audio is already ready, hand back the URL immediately; if a job
 * is already pending, don't queue a second one; otherwise (never
 * attempted, or a previous attempt failed) queue a fresh job and report
 * pending. Never blocks on generation itself — that's the whole point of
 * the job queue.
 */
export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const result = await getAudioStatus(id);
    if (!result) return json({ error: 'Article not found' }, { status: 404 });

    const { article, audio } = result;
    if (article.status !== 'published') {
      return json({ error: 'Audio is only available for published articles' }, { status: 400 });
    }

    if (audio.status === 'ready' || audio.status === 'pending') {
      return json({ audio });
    }

    // Missing ('none') or a previous attempt failed — either way, queue a
    // fresh attempt. A reader re-clicking Listen after a failure is exactly
    // how a transient failure gets retried sooner than the backoff schedule
    // would otherwise allow.
    await markAudioPending(id);
    await queueAudioGeneration(id);

    return json({ audio: { status: 'pending', url: null, durationSeconds: null, generatedAt: null, error: null } });
  } catch (error) {
    console.error('POST /api/news/[id]/audio error:', error);
    return json({ error: 'Failed to request audio' }, { status: 500 });
  }
}
