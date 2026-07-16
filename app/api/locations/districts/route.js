import { json, preflight } from '@/lib/api/cors';
import { getDistricts } from '@/lib/services/location/locationService';

export const OPTIONS = preflight;
export const revalidate = 86400;

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const stateId = searchParams.get('stateId');

    if (!stateId) {
      return json(
        {
          success: false,
          message: 'stateId is required.',
        },
        { status: 400 }
      );
    }

    const data = await getDistricts(stateId);

    return json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('GET /api/locations/districts error:', error);

    if (error.message === 'stateId is required.') {
      return json(
        {
          success: false,
          message: 'Failed to fetch districts.',
        },
        { status: 500 }
      );
    }

    return json(
      {
        success: false,
        message: 'Failed to fetch districts.',
      },
      { status: 500 }
    );
  }
}
