#!/usr/bin/env node
/**
 * CI guard: infrastructure SDKs must not sit in a request route's module-load graph.
 *
 * Generalizes ADR-001 beyond Firebase. The July 2026 outage was not really about
 * Firebase — it was about a *business operation* (publishing) acquiring a
 * module-load dependency on a *delivery SDK*. A module-load failure is the worst
 * kind: it happens before the handler's try/catch exists, so it is uncatchable,
 * unloggable, and total. Any heavy external SDK can do this. Resend, Cloudinary,
 * an AWS client and Sharp are all equally capable of it.
 *
 * Rule: a route may not reach an SDK below through STATIC imports unless the
 * (route, sdk) pair is in KNOWN_EXCEPTIONS with a reason. Dynamic `import()` is
 * fine — it defers evaluation past module load, which is the whole point.
 *
 * Cron/background routes are exempt: they are where delivery belongs.
 *
 * Run: node scripts/checkInfraBoundary.mjs      (npm run check:infra)
 */
import fs from 'fs';
import path from 'path';

const REPO = path.resolve(import.meta.dirname, '..');
const EXT = ['', '.js', '.jsx', '.ts', '.tsx', '/index.js', '/index.jsx'];

/** Delivery / heavy-infrastructure SDKs. Add new ones here as they arrive. */
const INFRA_SDKS = [
  'firebase-admin', 'firebase',
  'resend', 'nodemailer', '@sendgrid/mail', 'postmark', 'mailgun.js',
  'aws-sdk', '@aws-sdk',
  'cloudinary',
  'sharp', 'jimp', 'canvas',
  'pdfkit', 'pdf-lib', 'puppeteer', 'playwright',
  'twilio',
];

/**
 * Accepted (route, sdk) pairs. Every entry needs a reason. Entries marked DEBT
 * are known violations of the principle that are scheduled to be fixed — they
 * are recorded here so they cannot grow silently, and so removing one is a
 * visible, deliberate act.
 */
const KNOWN_EXCEPTIONS = [
  { route: 'app/api/cloudinary/signature/route.js', sdk: 'cloudinary',
    reason: 'OK — its entire purpose is signing Cloudinary uploads.', owner: 'platform', removeBy: 'never (by design)' },
  { route: 'app/api/admin/reels/route.js', sdk: 'cloudinary',
    reason: 'OK — admin reel create/update uploads and deletes media.', owner: 'platform', removeBy: 'never (by design)' },
  { route: 'app/api/admin/reels/[id]/route.js', sdk: 'cloudinary',
    reason: 'OK — admin reel create/update uploads and deletes media.', owner: 'platform', removeBy: 'never (by design)' },

  { route: 'app/api/admin/newsletter/send/route.js', sdk: 'resend',
    reason: 'DEBT — newsletter still sends synchronously. Migrate to the notification queue; the email sender then moves into notifications/delivery/.', owner: 'platform', removeBy: 'Phase 3' },

  // Public READ paths that reach Cloudinary only because reelService bundles
  // read and write helpers together. Same shape as the Firebase regression:
  // browsing reels should not depend on a media SDK loading.
  { route: 'app/api/reels/route.js', sdk: 'cloudinary',
    reason: 'DEBT — public read path; split read/write in reelService or make cloudinary lazy.', owner: 'platform', removeBy: 'Phase 5 (reels cleanup)' },
  { route: 'app/api/reels/[id]/route.js', sdk: 'cloudinary',
    reason: 'DEBT — public read path; see above.', owner: 'platform', removeBy: 'Phase 5 (reels cleanup)' },
  { route: 'app/api/reels/[id]/related/route.js', sdk: 'cloudinary',
    reason: 'DEBT — public read path; see above.', owner: 'platform', removeBy: 'Phase 5 (reels cleanup)' },
  { route: 'app/api/reels/[id]/analytics/route.js', sdk: 'cloudinary',
    reason: 'DEBT — public read path; see above.', owner: 'platform', removeBy: 'Phase 5 (reels cleanup)' },
  { route: 'app/api/news/[id]/reels/route.js', sdk: 'cloudinary',
    reason: 'DEBT — public read path; see above.', owner: 'platform', removeBy: 'Phase 5 (reels cleanup)' },
];

const isInfra = (spec) => INFRA_SDKS.find((s) => spec === s || spec.startsWith(s + '/'));
const isExempt = (route) => route.startsWith('app/api/cron/');
const exceptionFor = (route, sdk) => KNOWN_EXCEPTIONS.find((e) => e.route === route && e.sdk === sdk);

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

/** BFS so each reported chain is the shortest path to the offending SDK. */
function scan(entry) {
  const seen = new Set([entry]);
  const queue = [[entry, [entry]]];
  const hits = new Map();
  while (queue.length) {
    const [p, chain] = queue.shift();
    for (const spec of staticImports(p)) {
      const sdk = isInfra(spec);
      if (sdk && !hits.has(sdk)) hits.set(sdk, { chain: [...chain, spec], spec });
      const r = resolveSpec(spec, p);
      if (r && !seen.has(r)) { seen.add(r); queue.push([r, [...chain, r]]); }
    }
  }
  return hits;
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

const routes = allRoutes('app/api').sort();
const violations = [];
const accepted = [];
const usedExceptions = new Set();

for (const route of routes) {
  if (isExempt(route)) continue;
  for (const [sdk, { chain }] of scan(route)) {
    const exc = exceptionFor(route, sdk);
    if (exc) { accepted.push({ route, sdk, chain, reason: exc.reason, owner: exc.owner, removeBy: exc.removeBy }); usedExceptions.add(`${route}|${sdk}`); }
    else violations.push({ route, sdk, chain });
  }
}

console.log(`Infrastructure boundary check — ${routes.length} routes, ${INFRA_SDKS.length} SDKs\n`);

if (violations.length) {
  console.log('NEW VIOLATIONS:');
  for (const v of violations) {
    console.log(`  ✗ ${v.route}`);
    console.log(`      reaches ${v.sdk} at module load`);
    console.log(`      via: ${v.chain.join(' -> ')}`);
  }
  console.log();
}

const debt = accepted.filter((a) => a.reason.startsWith('DEBT'));
if (debt.length) {
  console.log(`ACCEPTED DEBT (${debt.length}) — tracked, not failing the build:`);
  for (const d of debt) {
    console.log(`  • ${d.route}  ->  ${d.sdk}`);
    console.log(`      ${d.reason}`);
    console.log(`      owner: ${d.owner || '(none)'} | remove by: ${d.removeBy || '(unset)'}`);
  }
  console.log();
}
const ok = accepted.filter((a) => !a.reason.startsWith('DEBT'));
if (ok.length) {
  console.log(`LEGITIMATE (${ok.length}):`);
  for (const a of ok) console.log(`  ✓ ${a.route}  ->  ${a.sdk}`);
  console.log();
}

// A stale exception is a silent hole in the guard: it would keep permitting an
// SDK for a route that no longer uses it, and mask a genuine future regression.
const unannotated = KNOWN_EXCEPTIONS.filter((e) => !e.owner || !e.removeBy);
if (unannotated.length) {
  console.log('UNANNOTATED EXCEPTIONS — every entry needs an owner and a removeBy milestone:');
  for (const u of unannotated) console.log(`  ! ${u.route} -> ${u.sdk}`);
  console.log();
}

const stale = KNOWN_EXCEPTIONS.filter((e) => !usedExceptions.has(`${e.route}|${e.sdk}`));
if (stale.length) {
  console.log('STALE EXCEPTIONS — no longer needed, remove them from KNOWN_EXCEPTIONS:');
  for (const s of stale) console.log(`  ! ${s.route} -> ${s.sdk}`);
  console.log();
}

if (violations.length || stale.length || unannotated.length) {
  console.error(`FAIL: ${violations.length} new violation(s), ${stale.length} stale, ${unannotated.length} unannotated.`);
  console.error('An infrastructure SDK in a request route\'s module-load graph can take that route');
  console.error('down before its own try/catch exists. Load it lazily (await import()) inside the');
  console.error('function that needs it, or move the work behind the notification/job queue.');
  console.error('See docs/architecture/ADR-001-editorial-delivery-separation.md');
  process.exit(1);
}

console.log(`PASS: no new infrastructure SDK dependencies on request paths.`);
console.log(`Exception ledger: ${accepted.length} total — ${ok.length} by-design, ${debt.length} debt. Target for debt: 0.`);
