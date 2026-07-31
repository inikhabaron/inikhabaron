#!/usr/bin/env node
/**
 * CI guard: editorial routes may ENQUEUE work, never PERFORM delivery.
 *
 * The other two guards are structural — they check which files and packages a
 * route can reach. This one checks *intent*: it looks for calls to delivery
 * operations by name anywhere in an editorial route's module-load closure. That
 * survives file moves and directory renames, which a path-based rule does not.
 *
 * Allowed from editorial code:   createJob(), queue*Notification()
 * Forbidden:                     dispatch/send/target/token-resolution calls
 *
 * Run: node scripts/checkQueueBoundary.mjs      (npm run check:queue)
 */
import fs from 'fs';
import path from 'path';

const REPO = path.resolve(import.meta.dirname, '..');
const EXT = ['', '.js', '.jsx', '.ts', '.tsx', '/index.js', '/index.jsx'];

/** Names that mean "deliver now". Calling any of these from editorial code
 *  reconnects the two layers, which is the regression this prevents. */
const FORBIDDEN_CALLS = [
  'dispatchJobNow',
  'runNextPendingJob',
  'sendToTokens',
  'sendEachForMulticast',
  'sendMulticast',
  'getAdminMessaging',
  'resolveTargetUserIds',
  'getTokensForUserIds',
  'sendNewsletter',
  'sendNewsletterEmail',
  'sendEmail',
  'sendMail',
];

/** The only notification entry points editorial code may call. */
const ALLOWED_CALLS = [
  'createJob',
  'queueBreakingNotification',
  'queueTrendingNotification',
  'queuePublishedNotification',
];

const QUEUE_MODULE = 'lib/services/notifications/articleNotificationQueue.js';

function resolveSpec(spec, fromPath) {
  let base;
  if (spec.startsWith('@/')) base = spec.slice(2);
  else if (spec.startsWith('./') || spec.startsWith('../')) {
    const dir = fromPath.split('/').slice(0, -1);
    for (const p of spec.split('/')) {
      if (p === '.') continue; else if (p === '..') dir.pop(); else dir.push(p);
    }
    base = dir.join('/');
  } else return null;
  for (const e of EXT) {
    const f = path.join(REPO, base + e);
    if (fs.existsSync(f) && fs.statSync(f).isFile()) return (base + e).replace(/\\/g, '/');
  }
  return null;
}

function read(relPath) {
  const abs = path.join(REPO, relPath);
  if (!fs.existsSync(abs)) return '';
  return fs.readFileSync(abs, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
}

function staticImports(src) {
  const re = /(?:^|\n)\s*(?:import\s+(?:[\s\S]*?)\s+from\s*|import\s*|export\s+(?:\*|\{[\s\S]*?\})\s+from\s*)['"]([^'"]+)['"]/g;
  const out = [];
  let m;
  while ((m = re.exec(src))) out.push(m[1]);
  return out;
}

/** Call sites only — a declaration of the same name is not a call. */
function callsIn(src, name) {
  const re = new RegExp(`(^|[^\\w.])${name}\\s*\\(`, 'g');
  let m;
  let count = 0;
  while ((m = re.exec(src))) {
    const before = src.slice(Math.max(0, m.index - 40), m.index + m[0].length);
    if (/\b(async\s+)?function\s+$/.test(before.slice(0, before.length - name.length - m[0].length + m[0].indexOf(name)))) continue;
    if (new RegExp(`(export\\s+)?(async\\s+)?function\\s+${name}\\s*\\(`).test(before)) continue;
    count += 1;
  }
  return count;
}

function closure(entry) {
  const seen = new Set([entry]);
  const stack = [entry];
  while (stack.length) {
    const p = stack.pop();
    for (const spec of staticImports(read(p))) {
      const r = resolveSpec(spec, p);
      if (r && !seen.has(r)) { seen.add(r); stack.push(r); }
    }
  }
  return seen;
}

function allRoutes(dir, out = []) {
  const abs = path.join(REPO, dir);
  if (!fs.existsSync(abs)) return out;
  for (const e of fs.readdirSync(abs, { withFileTypes: true })) {
    const rel = `${dir}/${e.name}`;
    if (e.isDirectory()) allRoutes(rel, out);
    else if (e.name === 'route.js') out.push(rel);
  }
  return out;
}

const routes = allRoutes('app/api').filter((r) => !r.startsWith('app/api/cron/'));
const editorial = routes.filter((r) => closure(r).has(QUEUE_MODULE));

if (!editorial.length) {
  console.error('✗ No editorial routes found reaching the queue — QUEUE_MODULE path may be stale.');
  process.exit(1);
}

console.log(`Queue boundary check — ${editorial.length} editorial route(s)\n`);

let violations = 0;
for (const route of editorial) {
  const files = closure(route);
  const found = [];
  for (const f of files) {
    const src = read(f);
    for (const name of FORBIDDEN_CALLS) {
      const n = callsIn(src, name);
      if (n > 0) found.push({ file: f, name, n });
    }
  }
  const enqueues = ALLOWED_CALLS.reduce((acc, n) => acc + callsIn(read(route), n), 0);

  if (found.length) {
    violations += found.length;
    console.log(`  ✗ ${route}`);
    for (const f of found) console.log(`      calls ${f.name}() in ${f.file}`);
  } else {
    console.log(`  ✓ ${route}  (${files.size} files; ${enqueues} enqueue call(s), 0 delivery calls)`);
  }
}

if (violations) {
  console.error(`\nFAIL: ${violations} queue-boundary violation(s).`);
  console.error('Editorial routes enqueue work; the cron worker delivers it. Call the Layer 1');
  console.error('queue (queue*Notification / createJob) and let the worker do the rest.');
  console.error('See docs/architecture/ADR-001-editorial-delivery-separation.md');
  process.exit(1);
}

console.log('\nPASS: editorial routes only enqueue — no delivery calls reachable.');
