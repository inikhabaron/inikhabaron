import { BSON } from 'mongodb';

/**
 * Bounds an article's `versionHistory`.
 *
 * Every edit stores a full copy of the previous article body in the document.
 * Unbounded, that grows by one body per save: a 3 MB article (35 production
 * articles embed base64 images) hit MongoDB's 16 MB document limit on its 5th
 * edit and could no longer be saved at all, and saves got slower as the
 * document grew. Two limits keep editing possible:
 *
 *   - at most MAX_VERSIONS entries, and
 *   - the whole document (article after this edit + its history) is kept under
 *     DOCUMENT_BUDGET_BYTES, dropping the OLDEST versions first. The 4 MB of
 *     headroom below the 16 MB hard limit covers the edit itself growing.
 *
 * For an ordinary article this keeps the last 20 versions. Only very large
 * bodies keep fewer (a 3 MB body keeps 2).
 */
export const MAX_VERSIONS = 20;
export const DOCUMENT_BUDGET_BYTES = 12 * 1024 * 1024;

const sizeOf = (value) => BSON.calculateObjectSize({ value });

/**
 * @param article          the article as stored, before this edit
 * @param previousVersion  the snapshot of the article as it is now
 * @param update           the fields this edit will $set (used to size the result)
 * @returns the versionHistory array to store
 */
export function nextVersionHistory(article, previousVersion, update = {}) {
  const { versionHistory = [], ...rest } = article;

  const kept = [...versionHistory, previousVersion].slice(-MAX_VERSIONS);

  const articleAfterEdit = BSON.calculateObjectSize({ ...rest, ...update });

  while (kept.length > 0 && articleAfterEdit + sizeOf(kept) > DOCUMENT_BUDGET_BYTES) {
    kept.shift();
  }

  return kept;
}
