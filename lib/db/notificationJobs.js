import { getDbCollection } from './index';
import { COLLECTIONS } from '@/lib/constants/collections';

// Despite the name/collection staying notification-specific for now (see
// docs/mvp3-phase1-architecture.md's Async Job Platform record), this
// collection holds every job kind (`kind: 'notification' | 'audio_generation'
// | 'voice_briefing'`) — the generic engine in lib/services/jobs/jobService.js
// is the actual consumer for non-notification kinds. Renaming the collection
// was deliberately deferred: it's live data (incl. a real pending backlog
// under separate investigation) and the name is cosmetic, not functional.
export async function getNotificationJobsCollection() {
  return getDbCollection(COLLECTIONS.NOTIFICATION_JOBS, [
    {
      keys: { id: 1 },
      options: { unique: true }
    },
    {
      keys: { status: 1, createdAt: 1 }
    },
    {
      keys: { kind: 1, status: 1, createdAt: 1 }
    }
  ]);
}
