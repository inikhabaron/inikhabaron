import { success, failure } from '@/lib/api/response';
import { logApiError } from '@/lib/api/errors';
import { getReelsCollection } from '@/lib/db/reels';
import { getReelThumbnailUrl } from '@/lib/cloudinary';

// Reverse lookup for the reel<->article linking capability (backend-only
// this phase, see plan §4) — lets a future "Watch Reel" affordance on an
// article page find any reels linked to it, without the website needing to
// build a Reels feed of its own yet.
export async function GET(request, { params }) {
  try {
    const { id: articleId } = await params;

    const reels = await getReelsCollection();
    const docs = await reels
      .find({ linkedArticleId: articleId, status: 'published', isDeleted: false })
      .project({ id: 1, title: 1, thumbnail: 1, video: 1, _id: 0 })
      .sort({ publishedAt: -1 })
      .toArray();

    const items = docs.map((reel) => {
      const customPublicId = reel.thumbnail?.publicId;
      const publicId = customPublicId || reel.video?.publicId;
      return {
        id: reel.id,
        title: reel.title,
        thumbnail: publicId ? getReelThumbnailUrl(publicId, 'small', { isVideo: !customPublicId }) : null,
      };
    });

    return success({ items }, 'Linked reels fetched successfully');
  } catch (error) {
    logApiError('GET /api/news/[id]/reels', error);
    return failure('Unable to fetch linked reels', 500);
  }
}
