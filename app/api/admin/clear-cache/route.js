import { invalidateCache } from '@/lib/cache';

export async function GET() {
  try {
    await invalidateCache('*');

    return Response.json({
      success: true,
      message: 'Cache cleared'
    });
  } catch (error) {
    return Response.json({
      success: false,
      error: error.message
    });
  }
}