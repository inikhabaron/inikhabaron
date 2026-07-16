import { json, preflight } from '@/lib/api/cors';
import { getStates } from '@/lib/services/location/locationService';

export const OPTIONS = preflight;
export const revalidate = 86400;

export async function GET() {
  try {
    const data = await getStates();

    return json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('GET /api/locations/states error:', error);

    return json(
      {
        success: false,
        message: 'Failed to fetch states.',
      },
      { status: 500 }
    );
  }
}
