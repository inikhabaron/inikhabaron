import { getReelCommentsCollection } from '@/lib/db/reelComments';
import { isAutoModerationEnabled } from '@/lib/services/settings/commentModerationService';

export async function autoApprovePendingReelComments() {
  const moderation = await isAutoModerationEnabled();
  if (!moderation.enabled) {
    return;
  }

  const comments = await getReelCommentsCollection();

  await comments.updateMany(
    {
      status: 'pending',
      approveAt: { $lte: new Date() },
    },
    {
      $set: { status: 'approved', updatedAt: new Date() },
      $unset: { approveAt: '' },
      $push: {
        moderationHistory: {
          action: 'approved',
          by: 'system',
          byName: 'Auto Moderation',
          at: new Date(),
          reason: 'Automatically approved',
        },
      },
    }
  );
}
