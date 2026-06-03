import { json, preflight } from '@/lib/api/cors';
import { ensureIndexes } from '@/lib/db-init';

export const OPTIONS = preflight;

export async function POST(request) {
  try {
    // Optional simple token protection
    const initToken = process.env.INIT_DB_TOKEN;
    const headerToken = request.headers.get('x-init-token');
    if (initToken && initToken !== headerToken) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const success = await ensureIndexes();
    if (!success) {
      return json({ success: false, message: 'Index creation failed' }, { status: 500 });
    }

    return json({ success: true, message: 'Indexes created' });
  } catch (error) {
    console.error('POST /api/admin/init-db error:', error);
    return json({ error: error.message }, { status: 500 });
  }
}
