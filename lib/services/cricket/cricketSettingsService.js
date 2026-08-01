// Admin-configurable behaviour for the cricket module — same singleton-doc
// pattern as lib/services/settings/commentModerationService.js, stored in
// the shared SYSTEM_SETTINGS collection under a fixed _id rather than a
// dedicated collection (small, always read as one document, never queried
// from "the other side").
import { getSystemSettingsCollection } from '@/lib/db/systemSettings';
import { CRICKET_TIER_LIST } from '@/lib/cricket/matchPriority';

const SETTINGS_ID = 'cricket_module';

function getDefaultSettings() {
  return {
    _id: SETTINGS_ID,
    enabled: true,
    homepageWidgetEnabled: true,
    homepageWidgetSize: 'compact', // 'compact' | 'expanded'
    // Domestic cricket is opted out by default — an Indian news audience
    // did not come to the homepage to see Zimbabwe's domestic 50-over final.
    preferredLeagues: CRICKET_TIER_LIST.filter((tier) => tier !== 'domestic'),
    featuredTournament: '', // free-text match against name/team, pins to top when set
    // Deliberately not null (the adaptive 60s-live rate), because that rate
    // assumes an unmetered provider. CricAPI's free plan allows 100
    // requests/day and a single tab polling at 60s is ~1440. 30 min keeps
    // one continuously-open tab at ~48/day, leaving room for match-detail
    // pages inside the same allowance. Set this back to null once on a plan
    // that can absorb per-minute polling.
    refreshIntervalSeconds: 1800,
    updatedBy: null,
    updatedAt: new Date(),
  };
}

export async function getCricketSettings() {
  const collection = await getSystemSettingsCollection();
  let settings = await collection.findOne({ _id: SETTINGS_ID });

  if (!settings) {
    const defaults = getDefaultSettings();
    await collection.insertOne(defaults);
    settings = defaults;
  }

  return settings;
}

export async function updateCricketSettings(settings, admin) {
  const collection = await getSystemSettingsCollection();

  const preferredLeagues = Array.isArray(settings.preferredLeagues)
    ? settings.preferredLeagues.filter((tier) => CRICKET_TIER_LIST.includes(tier))
    : CRICKET_TIER_LIST.filter((tier) => tier !== 'domestic');

  await collection.updateOne(
    { _id: SETTINGS_ID },
    {
      $set: {
        enabled: Boolean(settings.enabled),
        homepageWidgetEnabled: Boolean(settings.homepageWidgetEnabled),
        homepageWidgetSize: settings.homepageWidgetSize === 'expanded' ? 'expanded' : 'compact',
        preferredLeagues,
        featuredTournament: typeof settings.featuredTournament === 'string' ? settings.featuredTournament.trim() : '',
        refreshIntervalSeconds: Number.isFinite(Number(settings.refreshIntervalSeconds)) && Number(settings.refreshIntervalSeconds) > 0
          ? Number(settings.refreshIntervalSeconds)
          : null,
        updatedBy: admin.id,
        updatedAt: new Date(),
      },
    },
    { upsert: true },
  );

  return getCricketSettings();
}
