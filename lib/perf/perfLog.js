// Ad-hoc timing instrumentation for tracking down the 15-45s MongoDB stalls
// (homepage / /api/news / /api/news/breaking). Wraps a single async step and
// logs its duration in the `[PERF] <label>: <ms>ms` format so production logs
// (Vercel runtime logs) can be grepped for exactly which step is slow.
//
// Logs a "started" line too, not just the completion line — if a step hangs
// for 15-45s, tailing logs live still shows which step is currently stuck,
// instead of going silent until it eventually resolves.
//
// Set PERF_LOGS=false to silence these once the investigation is done —
// intentionally NOT wired to NODE_ENV, since this is a temporary diagnostic
// tool, not permanent app behavior.
const ENABLED = process.env.PERF_LOGS !== 'false';

export async function timeAsync(label, fn) {
  if (!ENABLED) return fn();

  const start = performance.now();
  console.log(`[PERF] ${label}: started`);
  try {
    const result = await fn();
    console.log(`[PERF] ${label}: ${(performance.now() - start).toFixed(0)}ms`);
    return result;
  } catch (err) {
    console.log(`[PERF] ${label}: FAILED after ${(performance.now() - start).toFixed(0)}ms - ${err.message}`);
    throw err;
  }
}
