import { getCommentsCollection } from '@/lib/db/comments';

import {
  isAutoModerationEnabled,
} from '@/lib/services/settings/commentModerationService';

export async function autoApprovePendingComments() {

  const moderation =
    await isAutoModerationEnabled();

  if (!moderation.enabled) {
    return;
  }

  const comments =
    await getCommentsCollection();

  await comments.updateMany(
    {
      status: 'pending',

      approveAt: {
        $lte: new Date(),
      },
    },
    {
      $set: {
        status: 'approved',

        updatedAt: new Date(),
      },
      $unset: {
        approveAt: '',
      },
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