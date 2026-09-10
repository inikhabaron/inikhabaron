import cloudinary from '@/lib/cloudinary';

/**
 * Server-side audio upload. Deliberately reuses the existing Cloudinary
 * integration (lib/cloudinary.js) that Reels already established — Cloudinary
 * treats audio as `resource_type: 'video'` (no visual track), so this is a
 * new upload METHOD, not new storage infrastructure. Unlike Reels' client-
 * signed upload (a user's own device uploads directly), this uploads a
 * buffer the server already has in memory (TTS output), so it goes straight
 * through the already-configured server-side SDK — no signature dance
 * needed.
 */
export async function uploadAudioBuffer(buffer, { publicId, folder = 'audio/news' } = {}) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'video', // Cloudinary's audio resource type
        folder,
        public_id: publicId,
        overwrite: true,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve({
          url: result.secure_url,
          durationSeconds: result.duration ? Math.round(result.duration) : null,
          publicId: result.public_id,
        });
      }
    );
    uploadStream.end(buffer);
  });
}
