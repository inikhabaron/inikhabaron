import { json, preflight } from '@/lib/api/cors';

export const OPTIONS = preflight;

export async function GET() {
  return json({
    success: true,
    route: "breaking"
  });
}