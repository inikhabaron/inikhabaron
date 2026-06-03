// Cloudinary Configuration
// TODO: Add your Cloudinary credentials in .env file

import { v2 as cloudinary } from 'cloudinary';
import logger from '@/lib/logger';

// Server-side configuration - validate env
if (typeof window === 'undefined') {
  const missing = [];
  if (!process.env.CLOUDINARY_CLOUD_NAME) missing.push('CLOUDINARY_CLOUD_NAME');
  if (!process.env.CLOUDINARY_API_KEY) missing.push('CLOUDINARY_API_KEY');
  if (!process.env.CLOUDINARY_API_SECRET) missing.push('CLOUDINARY_API_SECRET');
  if (missing.length > 0) {
    logger.warn('Cloudinary not fully configured; missing env vars', { missing });
  }

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
