#!/usr/bin/env node
import { ensureIndexes } from '@/lib/db-init';

async function run() {
  console.log('Initializing database indexes...');
  const ok = await ensureIndexes();
  if (ok) {
    console.log('Indexes created successfully');
    process.exit(0);
  } else {
    console.error('Index creation failed');
    process.exit(2);
  }
}

run().catch(err => {
  console.error('Init-db script error:', err);
  process.exit(1);
});
