// Cloudinary Configuration
// TODO: Add your Cloudinary credentials in .env file

import { v2 as cloudinary } from 'cloudinary';

// Server-side configuration
if (typeof window === 'undefined') {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

// Generate signature for signed uploads
export function generateUploadSignature(folder = 'news', resourceType = 'image') {
  const timestamp = Math.round(new Date().getTime() / 1000);
  
  const params = {
    timestamp,
    folder,
  };
  
  const signature = cloudinary.utils.api_sign_request(
    params,
    process.env.CLOUDINARY_API_SECRET
  );
  
  return {
    signature,
    timestamp,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    folder,
    resourceType,
  };
}

// Reel thumbnails are never uploaded as separate assets: all three sizes are
// derived on demand via Cloudinary URL transforms from the single uploaded
// video (or a single custom-uploaded thumbnail image), so there's no extra
// upload or storage per size.
const REEL_THUMBNAIL_SIZES = {
  small: { width: 150, height: 267 }, // feed/list rows
  medium: { width: 300, height: 533 }, // admin previews
  large: { width: 720, height: 1280 }, // share previews / OG image
};

export function getReelThumbnailUrl(publicId, size = 'medium', { offsetSeconds = 0, isVideo = true } = {}) {
  const { width, height } = REEL_THUMBNAIL_SIZES[size] || REEL_THUMBNAIL_SIZES.medium;
  const transform = `w_${width},h_${height},c_fill`;
  return isVideo
    ? `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/video/upload/so_${offsetSeconds},${transform}/${publicId}.jpg`
    : `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/${transform}/${publicId}.jpg`;
}

// The raw secure_url Cloudinary's upload response returns is the original
// asset — full source bitrate, whatever format the uploader's device
// produced (MP4/MOV/etc.), no adaptive quality. Cloudinary can instead
// transcode+compress on delivery via `f_auto` (best format for the
// requesting client) and `q_auto` (perceptual-quality-based compression) —
// this is a pure URL-parameter change, no re-upload or extra storage, and
// it's what any client (this admin panel's preview, a future RN app, or a
// future website Reels feed) should actually play, not the raw upload URL.
export function getOptimizedVideoUrl(publicId, format = 'mp4', quality = 'auto') {
  return `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/video/upload/f_auto,q_${quality}/${publicId}.${format}`;
}

// Delete image from Cloudinary
export async function deleteImage(publicId) {
  try {
    const result = await cloudinary.uploader.destroy(publicId, { invalidate: true });
    return { success: true, result };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export default cloudinary;
