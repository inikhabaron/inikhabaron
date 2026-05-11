import { ADS_CONFIG } from '@/lib/services/ads';
import { json, preflight } from '@/lib/api/cors';

export const OPTIONS = preflight;

export async function GET() {
  return json({ config: ADS_CONFIG });
}
