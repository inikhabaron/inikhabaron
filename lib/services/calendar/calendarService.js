import { format, startOfDay, endOfDay } from 'date-fns';
import { getCollection } from '@/lib/mongodb';
import { COLLECTIONS } from '@/lib/constants/collections';

const USER_PROJECTION = { _id: 0, id: 1, name: 1, avatar: 1, role: 1 };

const TASK_STATUSES = ['pending_review', 'needs_revision', 'ready_to_publish'];

const ARTICLE_PROJECTION = {
  _id: 0, id: 1, title: 1, slug: 1, status: 1, category: 1,
  authorId: 1, authorName: 1, isBreaking: 1,
  scheduledAt: 1, publishedAt: 1, createdAt: 1, updatedAt: 1,
  versionHistory: 1, corrections: 1,
};

/**
 * Every activity type below is derived entirely from fields already on the
 * `news` document (or its embedded versionHistory/corrections arrays) — no
 * new schema fields or collections. "Tasks & Notifications" and "Drafts"
 * (which folds in the requested "Planned Content" concept, since there is no
 * separate planned-content field) are real workflow signals, not fabricated.
 */

async function findCandidateArticles(start, end) {
  const newsCollection = await getCollection(COLLECTIONS.NEWS);
  return newsCollection.find(
    {
      $or: [
        { publishedAt: { $gte: start, $lte: end } },
        { scheduledAt: { $gte: start, $lte: end } },
        { status: 'draft', createdAt: { $gte: start, $lte: end } },
        { status: { $in: TASK_STATUSES }, updatedAt: { $gte: start, $lte: end } },
        { versionHistory: { $elemMatch: { editedAt: { $gte: start, $lte: end } } } },
        { corrections: { $elemMatch: { at: { $gte: start, $lte: end } } } },
      ],
    },
    { projection: ARTICLE_PROJECTION }
  ).toArray();
}

function inRange(date, start, end) {
  if (!date) return false;
  const d = new Date(date);
  return d >= start && d <= end;
}

/** Flattens one article into zero-or-more dated activity entries. */
function buildRawEntries(article, start, end) {
  const entries = [];
  const common = {
    articleId: article.id,
    articleTitle: article.title,
    articleSlug: article.slug,
    articleCategory: article.category,
    articleStatus: article.status,
    articleAuthorId: article.authorId,
  };

  if (inRange(article.publishedAt, start, end)) {
    entries.push({ ...common, type: 'published', date: article.publishedAt, actorId: article.authorId, actorName: article.authorName });
  }
  if (article.status === 'scheduled' && inRange(article.scheduledAt, start, end)) {
    entries.push({ ...common, type: 'scheduled', date: article.scheduledAt, actorId: article.authorId, actorName: article.authorName });
  }
  if (article.status === 'draft' && inRange(article.createdAt, start, end)) {
    entries.push({ ...common, type: 'draft', date: article.createdAt, actorId: article.authorId, actorName: article.authorName });
  }
  if (TASK_STATUSES.includes(article.status) && inRange(article.updatedAt, start, end)) {
    entries.push({
      ...common, type: 'tasks', date: article.updatedAt, actorId: article.authorId, actorName: article.authorName,
      extra: { reason: 'status', label: article.status === 'pending_review' ? 'Needs review' : article.status === 'needs_revision' ? 'Needs revision' : 'Ready to publish' },
    });
  }
  for (const version of article.versionHistory || []) {
    if (inRange(version.editedAt, start, end)) {
      entries.push({ ...common, type: 'updated', date: version.editedAt, actorId: version.editedBy, actorName: version.editedByName });
    }
  }
  for (const correction of article.corrections || []) {
    if (inRange(correction.at, start, end)) {
      entries.push({
        ...common, type: 'tasks', date: correction.at, actorId: correction.by, actorName: correction.byName,
        extra: { reason: 'correction', label: 'Correction requested', text: correction.text },
      });
    }
  }
  const breakingDate = article.publishedAt || article.scheduledAt || article.updatedAt;
  if (article.isBreaking && inRange(breakingDate, start, end)) {
    entries.push({ ...common, type: 'breaking', date: breakingDate, actorId: article.authorId, actorName: article.authorName });
  }

  return entries;
}

async function joinActors(entries) {
  const ids = [...new Set(entries.map((e) => e.actorId).filter(Boolean))];
  if (!ids.length) return new Map();
  const usersCollection = await getCollection(COLLECTIONS.USERS);
  const users = await usersCollection.find({ id: { $in: ids } }, { projection: USER_PROJECTION }).toArray();
  return new Map(users.map((u) => [u.id, u]));
}

function resolveActor(entry, actorsById) {
  const found = actorsById.get(entry.actorId);
  return {
    id: entry.actorId || null,
    name: found?.name || entry.actorName || null,
    avatar: found?.avatar || null,
    role: found?.role || null,
    exists: !!found,
  };
}

function passesFilters(entry, actor, filters) {
  if (filters.types?.length && !filters.types.includes(entry.type)) return false;
  if (filters.category && entry.articleCategory !== filters.category) return false;
  if (filters.role && actor.role !== filters.role) return false;
  if (filters.authorName && !(actor.name || '').toLowerCase().includes(filters.authorName.toLowerCase())) return false;
  return true;
}

function emptyCounts() {
  return { published: 0, scheduled: 0, updated: 0, breaking: 0, draft: 0, tasks: 0 };
}

/** Counts unique articles (not raw events) per type — see module docstring. */
function dedupeCountByType(entries) {
  const counts = emptyCounts();
  const seen = new Set();
  for (const entry of entries) {
    const key = `${entry.type}|${entry.articleId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    counts[entry.type] += 1;
  }
  return counts;
}

/**
 * Month overview for the calendar grid's dot indicators.
 *
 * IMPORTANT counting semantic: each count is the number of *unique articles*
 * with at least one activity of that type on that date, not the number of
 * discrete events — an article edited 3 times in a day contributes
 * `updated: 1`, not `3`. This matches getDayActivity's `summary` (see below)
 * so the grid dot and the panel header always agree; only the itemized
 * `sections` list in getDayActivity is un-deduplicated (it intentionally
 * shows every discrete event).
 */
export async function getMonthActivityCounts({ start, end, filters = {} }) {
  const articles = await findCandidateArticles(start, end);
  const rawEntries = articles.flatMap((a) => buildRawEntries(a, start, end));
  const actorsById = await joinActors(rawEntries);

  const byDay = new Map();
  for (const entry of rawEntries) {
    const actor = resolveActor(entry, actorsById);
    if (!passesFilters(entry, actor, filters)) continue;
    const key = format(new Date(entry.date), 'yyyy-MM-dd');
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key).push(entry);
  }

  const counts = {};
  for (const [key, entries] of byDay) {
    counts[key] = dedupeCountByType(entries);
  }
  return counts;
}

const SECTION_BY_TYPE = {
  scheduled: 'schedule', published: 'published', updated: 'updated',
  breaking: 'breaking', draft: 'drafts', tasks: 'tasks',
};

/**
 * Full itemized detail for exactly one day (the Day Schedule panel).
 *
 * `summary` uses the same unique-article dedup as getMonthActivityCounts, so
 * it matches the grid dot the user just clicked. `sections` is intentionally
 * NOT deduplicated — it lists every discrete event (e.g. two separate
 * correction requests on the same article both appear as separate rows).
 */
export async function getDayActivity({ date, filters = {} }) {
  const start = startOfDay(date);
  const end = endOfDay(date);
  const articles = await findCandidateArticles(start, end);
  const rawEntries = articles.flatMap((a) => buildRawEntries(a, start, end));
  const actorsById = await joinActors(rawEntries);

  const sections = { schedule: [], published: [], updated: [], breaking: [], drafts: [], tasks: [] };
  const passedEntries = [];

  let counter = 0;
  for (const entry of rawEntries) {
    const actor = resolveActor(entry, actorsById);
    if (!passesFilters(entry, actor, filters)) continue;
    passedEntries.push(entry);
    counter += 1;
    sections[SECTION_BY_TYPE[entry.type]].push({
      id: `${entry.articleId}-${entry.type}-${counter}`,
      articleId: entry.articleId,
      title: entry.articleTitle,
      slug: entry.articleSlug,
      category: entry.articleCategory,
      status: entry.articleStatus,
      authorId: entry.articleAuthorId,
      time: entry.date,
      type: entry.type,
      actor,
      extra: entry.extra || null,
    });
  }

  for (const key of Object.keys(sections)) {
    sections[key].sort((a, b) => new Date(a.time) - new Date(b.time));
  }

  return {
    date: format(date, 'yyyy-MM-dd'),
    summary: dedupeCountByType(passedEntries),
    sections,
  };
}

export async function scheduleArticle({ articleId, scheduledAt }) {
  const newsCollection = await getCollection(COLLECTIONS.NEWS);
  const article = await newsCollection.findOne({ id: articleId });

  if (!article) {
    return { error: 'not_found' };
  }

  if (article.status === 'published') {
    return { error: 'already_published' };
  }

  const scheduledDate = new Date(scheduledAt);
  if (Number.isNaN(scheduledDate.getTime()) || scheduledDate <= new Date()) {
    return { error: 'invalid_date' };
  }

  await newsCollection.updateOne(
    { id: articleId },
    { $set: { status: 'scheduled', scheduledAt: scheduledDate, updatedAt: new Date() } }
  );

  return { article: await newsCollection.findOne({ id: articleId }) };
}
