import { sendNewsletter } from '../lib/services/newsletter/sendNewsletterService.js';
import { getDatabase } from '../lib/mongodb.js';

// Calls the exact same service the admin "Send Monthly Newsletter" button
// uses (app/api/admin/newsletter/send/route.js), so behavior never diverges
// between a manual admin send and this scheduled entry point.
//
// Safe to run repeatedly: sendNewsletter() checks the newsletter_campaigns
// log for a completed 'monthly' send this calendar month and refuses to
// re-send unless forced — so a cron misfire or accidental re-run is a no-op,
// not a duplicate email blast. Pass --force to override (e.g. re-running
// after fixing a bad Resend API key mid-month).
const FORCE = process.argv.includes('--force');

async function run() {
  let exitCode = 0;
  try {
    console.log(`[sendMonthlyNewsletter] Starting monthly newsletter send${FORCE ? ' (forced)' : ''}...`);
    const result = await sendNewsletter({ type: 'monthly', force: FORCE, initiatedBy: 'scheduler' });

    if (!result.success) {
      if (result.alreadySent) {
        console.log(`[sendMonthlyNewsletter] Skipped: ${result.error}`);
      } else {
        console.error(`[sendMonthlyNewsletter] Not sent: ${result.error}`);
        exitCode = 1;
      }
    } else {
      console.log(
        `[sendMonthlyNewsletter] Done. sent=${result.sent} failed=${result.failed} skipped=${result.skipped} total=${result.total}`
      );
      if (result.failures?.length) {
        console.log('[sendMonthlyNewsletter] Failures (up to 20):', result.failures);
      }
    }
  } catch (error) {
    console.error('[sendMonthlyNewsletter] Fatal error:', error);
    exitCode = 1;
  } finally {
    // Explicitly close the connection pool rather than force-exiting —
    // process.exit() while the Resend HTTP client / Mongo driver still have
    // handles mid-close crashes with a libuv assertion on Windows
    // (UV_HANDLE_CLOSING, src/win/async.c). Closing first lets the event
    // loop drain naturally.
    //
    // Uses getDatabase()/db.client rather than lib/mongodb.js's default
    // export — under tsx (see package.json "send:monthly-newsletter"), a
    // plain `export default clientPromise` resolves to the module's whole
    // namespace object instead of the client, a known esbuild/CJS-interop
    // wrinkle with default-exported values. Named exports are unaffected.
    try {
      const db = await getDatabase();
      await db.client.close();
    } catch {
      // best-effort cleanup — don't let a close failure mask the real result
    }
  }
  process.exitCode = exitCode;
}

run();
