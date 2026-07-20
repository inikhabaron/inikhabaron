import axios from 'axios';
import { requireUser } from '@/lib/auth/user/requireUser';
import { json, preflight } from '@/lib/api/cors';
import { matchLocation } from '@/lib/services/location/locationMatcher';

export const OPTIONS = preflight;

/**
 * POST /api/users/location/detect
 * Reverse-geocodes {lat, lng} and matches it against the seeded `locations`
 * collection. Does NOT persist anything — the client confirms the result,
 * then saves it via the existing PUT /api/users/location.
 */
export async function POST(request) {
  try {
    const auth = await requireUser();
    if (!auth.success) return auth.response;

    const body = await request.json().catch(() => ({}));
    const { lat, lng } = body;

    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return json({ success: false, message: 'lat and lng are required.' }, { status: 400 });
    }

    const geoResponse = await axios.get('https://api.bigdatacloud.net/data/reverse-geocode-client', {
      params: { latitude: lat, longitude: lng, localityLanguage: 'en' },
      timeout: 8000,
    });

    const geo = geoResponse.data || {};
    const stateName = geo.principalSubdivision || '';
    const districtName = geo.city || geo.locality || '';

    const match = await matchLocation({ stateName, districtName });

    return json({ success: true, data: match });
  } catch (error) {
    console.error('POST /api/users/location/detect error:', error);
    return json({ success: false, message: 'Unable to resolve location.' }, { status: 500 });
  }
}
