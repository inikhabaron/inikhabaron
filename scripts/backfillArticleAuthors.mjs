/**
 * One-off migration: freeze each legacy article's byline onto the article.
 *
 * WHY
 * Articles written before per-article author photos have no `authors` array.
 * Their photo was resolved live on every read — app/api/news/[id]/route.js and
 * lib/seo/data.js overwrote `authorAvatar` with the author's *current*
 * users.avatar. That made historical bylines mutable: updating a journalist's
 * profile photo retroactively changed every article they had ever written.
 *
 * This copies the photo each article displays *today* into
 * authors: [{ name, image }], so the live re-resolution can be removed without
 * any article's appearance changing.
 *
 * ORDER OF OPERATIONS — this must run BEFORE deploying the code that drops the
 * live re-resolution. Run it after, and any article whose stored authorAvatar
 * snapshot is stale or null shows the wrong photo (or none) in the gap.
 *
 * Idempotent: articles that already have a non-empty `authors` array are
 * skipped, so re-running is safe.
 *
 * Usage:
 *   node --env-file=.env scripts/backfillArticleAuthors.mjs --dry-run
 *   node --env-file=.env scripts/backfillArticleAuthors.mjs
 */
import { getCollection } from '../lib/mongodb.js';

const DRY_RUN = process.argv.includes('--dry-run');

async function backfillArticleAuthors() {
  try {
    const news = await getCollection('news');
    const users = await getCollection('users');

    const legacy = await news
      .find({ $or: [{ authors: { $exists: false } }, { authors: null }, { authors: { $size: 0 } }] })
      .toArray();

    if (!legacy.length) {
      console.log('✅ No legacy articles found — nothing to backfill.');
      process.exit(0);
    }

    console.log(`Found ${legacy.length} article(s) without an authors array.${DRY_RUN ? '  (dry run)' : ''}\n`);

    // One lookup per distinct author rather than per article.
    const authorIds = [...new Set(legacy.map((a) => a.authorId).filter(Boolean))];
    const profiles = await users
      .find({ id: { $in: authorIds } }, { projection: { id: 1, avatar: 1, name: 1 } })
      .toArray();
    const avatarById = new Map(profiles.map((u) => [u.id, u.avatar || null]));

    let migrated = 0;
    let skippedNoName = 0;

    for (const article of legacy) {
      const name = article.authorName || article.author || article.writer || article.byline;
      if (!name) {
        // Nothing to put in a byline; leave it for the runtime fallback.
        skippedNoName++;
        continue;
      }

      // Exactly what the article renders today: the live-resolved profile
      // avatar, falling back to the stored snapshot when the author account is
      // gone (the live lookup would have yielded null in that case too).
      const image = (article.authorId ? avatarById.get(article.authorId) : null) || article.authorAvatar || null;

      if (!DRY_RUN) {
        await news.updateOne(
          { id: article.id },
          { $set: { authors: [{ name: String(name).trim(), image }] } },
        );
      }
      migrated++;
    }

    console.log(`${DRY_RUN ? 'Would migrate' : '✅ Migrated'} ${migrated} article(s).`);
    if (skippedNoName) console.log(`   ${skippedNoName} skipped (no author name to record).`);
    if (DRY_RUN) console.log('\nRe-run without --dry-run to apply.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Article author backfill failed.');
    console.error(error);
    process.exit(1);
  }
}

backfillArticleAuthors();
