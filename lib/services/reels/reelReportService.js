import { getReelReportsCollection } from '@/lib/db/reelReports';
import { getReelsCollection } from '@/lib/db/reels';

// A second report from the same user is a no-op, mirroring how addLike
// treats an existing like — reports are deduped per user via the unique
// {reelId,userId} index, unlike the anonymous analytics events.
export async function addReelReport(userId, reelId, reason) {
  const reports = await getReelReportsCollection();
  const reels = await getReelsCollection();

  const existing = await reports.findOne({ userId, reelId });
  if (existing) {
    return { reported: true, alreadyExists: true };
  }

  await reports.insertOne({
    userId,
    reelId,
    reason: reason || '',
    createdAt: new Date(),
  });

  await reels.updateOne(
    { id: reelId },
    {
      $inc: { reportCount: 1 },
      $set: { isReported: true, reportStatus: 'pending', updatedAt: new Date() },
    }
  );

  return { reported: true, alreadyExists: false };
}
