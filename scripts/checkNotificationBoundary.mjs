#!/usr/bin/env node
/**
 * CI guard for the editorial/delivery boundary documented in CLAUDE.md
 * ("Notification architecture").
 *
 * Publishing must never be able to fail because push notifications are broken.
 * That holds only while no editorial route can reach Firebase Admin / FCM /
 * jwks-rsa / jose / the push sender / the dispatcher through a STATIC import —
 * the edges that execute at module load, before a route's own try/catch exists.
 *
 * Run: node scripts/checkNotificationBoundary.mjs
 * Exits non-zero on violation, so it can gate CI.
 *
 * Editorial routes are DISCOVERED, not listed: any route that reaches the
 * notification queue is treated as editorial. A new publishing action is
 * therefore covered automatically the moment it enqueues a notification.
 */
import fs from 'fs';
import path from 'path';

const REPO = path.resolve(import.meta.dirname, '..');
const EXT = ['', '.js', '.jsx', '.ts', '.tsx', '/index.js', '/index.jsx'];

const QUEUE_MODULE = 'lib/services/notifications/articleNotificationQueue.js';
const FORBIDDEN_FILE = [/^lib\/auth\/user\/firebase-admin\.js$/, /^lib\/services\/notifications\/delivery\//];
const FORBIDDEN_PKG = [/^firebase-admin(\/|$)/, /^firebase(\/|$)/, /^jwks-rsa(\/|$)/, /^jose$/];

function resolveSpec(spec, fromPath) {
  let base;
  if (spec.startsWith('@/')) base = spec.slice(2);
  else if (spec.startsWith('./') || spec.startsWith('../')) {
    const dir = fromPath.split('/').slice(0, -1);
    for (const p of spec.split('/')) {
      if (p === '.') continue; else if (p === '..') dir.pop(); else dir.push(p);
    }
    base = dir.join('/');
  } else return null; // bare specifier -> external package
  for (const e of EXT) {
    const f = path.join(REPO, base + e);
    if (fs.existsSync(f) && fs.statSync(f).isFile()) return (base + e).replace(/\\/g, '/');
  }
  return null;
}

// STATIC imports only. Dynamic import() is intentionally ignored: it defers
// evaluation past module load, which is what makes it safe here.
function staticImports(relPath) {
  const abs = path.join(REPO, relPath);
  if (!fs.existsSync(abs)) return [];
  const clean = fs.readFileSync(abs, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  const re = /(?:^|\n)\s*(?:import\s+(?:[\s\S]*?)\s+from\s*|import\s*|export\s+(?:\*|\{[\s\S]*?\})\s+from\s*)['"]([^'"]+)['"]/g;
  const out = [];
  let m;
  while ((m = re.exec(clean))) out.push(m[1]);
  return out;
}

/** Shortest static path from entry to each offender, for a readable failure. */
function scan(entry) {
  const seen = new Set([entry]);
  const queue = [[entry, [entry]]];
  const files = new Set();
  const badFiles = new Map();
  const badPkgs = new Map();
  while (queue.length) {
    const [p, chain] = queue.shift();
    files.add(p);
    for (const spec of staticImports(p)) {
      const resolved = resolveSpec(spec, p);
      if (resolved) {
        if (FORBIDDEN_FILE.some((re) => re.test(resolved)) && !badFiles.has(resolved)) {
          badFiles.set(resolved, [...chain, resolved]);
        }
        if (!seen.has(resolved)) { seen.add(resolved); queue.push([resolved, [...chain, resolved]]); }
      } else if (FORBIDDEN_PKG.some((re) => re.test(spec)) && !badPkgs.has(spec)) {
        badPkgs.set(spec, [...chain, spec]);
      }
    }
  }
  return { files, badFiles, badPkgs };
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

const routes = allRoutes('app/api');
const editorial = routes.filter((r) => !r.startsWith('app/api/cron/') && scan(r).files.has(QUEUE_MODULE));

if (editorial.length === 0) {
  console.error('✗ Found no editorial routes reaching the notification queue.');
  console.error('  Either the queue module moved (update QUEUE_MODULE) or the wiring broke.');
  process.exit(1);
}

let violations = 0;
console.log(`Notification boundary check — ${editorial.length} editorial route(s) discovered\n`);

for (const route of editorial) {
  const { files, badFiles, badPkgs } = scan(route);
  const offenders = [...badFiles.entries(), ...badPkgs.entries()];
  if (offenders.length === 0) {
    console.log(`  ✓ ${route}  (${files.size} files, clean)`);
    continue;
  }
  violations += offenders.length;
  console.log(`  ✗ ${route}`);
  for (const [what, chain] of offenders) {
    console.log(`      forbidden at module load: ${what}`);
    console.log(`      via: ${chain.join(' -> ')}`);
  }
}

// The boundary is only meaningful if delivery still exists on the other side.
const cronRoutes = routes.filter((r) => r.startsWith('app/api/cron/'));
const senderReachable = cronRoutes.some((r) =>
  [...scan(r).files].some((f) => f.startsWith('lib/services/notifications/delivery/'))
);
if (!senderReachable) {
  console.log('\n  ✗ No cron route reaches lib/services/notifications/delivery/ — nothing would ever send.');
  violations += 1;
} else {
  console.log('\n  ✓ delivery layer reachable from a cron route');
}

if (violations) {
  console.error(`\nFAIL: ${violations} boundary violation(s).`);
  console.error('Editorial routes must enqueue via articleNotificationQueue and never import the delivery layer.');
  console.error('See "Notification architecture" in CLAUDE.md.');
  process.exit(1);
}
console.log('\nPASS: editorial routes carry no Firebase/FCM/jose dependency at module load.');
