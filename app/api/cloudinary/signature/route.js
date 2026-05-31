import { generateUploadSignature } from '@/lib/cloudinary';
import { json, preflight } from '@/lib/api/cors';

export const OPTIONS = preflight;

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const folder = url.searchParams.get('folder') || 'news';
    const resourceType = url.searchParams.get('resource_type') || 'image';

    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return json({ error: 'Cloudinary credentials are not configured' }, { status: 500 });
    }

    const signature = generateUploadSignature(folder, resourceType);
    return json(signature);
  } catch (error) {
    console.error('GET /api/cloudinary/signature error:', error);
    return json({ error: error.message }, { status: 500 });
  }
}
