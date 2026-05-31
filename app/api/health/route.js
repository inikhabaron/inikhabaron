import { corsHeaders, json, preflight } from '@/lib/api/cors';

export const OPTIONS = preflight;

export async function GET() {
  return json({ status: 'ok', timestamp: new Date().toISOString() });
}
