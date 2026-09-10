/**
 * Google Cloud Text-to-Speech integration.
 *
 * Deliberately not implemented yet — deferred to Phase 3A.3 in the approved
 * build order (schema/queue/storage first, TTS vendor integration only once
 * GCP credentials exist). This project has no existing AI-vendor
 * relationship of any kind; Firebase already puts it on Google Cloud, which
 * may mean the same GCP project + service account can be reused once the
 * Text-to-Speech API is enabled on it — an account-console step, not
 * something doable from code.
 *
 * Throws clearly rather than returning null/undefined, so a claimed
 * audio_generation job fails with an actionable message ("TTS is not
 * configured yet") instead of crashing on an unexpected empty buffer
 * somewhere downstream.
 */
export async function synthesizeSpeech(text, { languageCode = 'hi-IN' } = {}) {
  throw new Error('Google Cloud TTS is not configured yet (Phase 3A.3) — no audio can be generated.');
}
