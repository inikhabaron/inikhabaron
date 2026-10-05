import { getSystemSettingsCollection } from '@/lib/db/systemSettings';

const SETTINGS_ID = 'comment_moderation';

// Temporary client request: let visitors comment without logging in. This is
// the value used when the settings doc has no explicit `allowGuestComments`
// yet. An admin flips it from the Comments tab — no redeploy — and switching
// it off restores the original login-only behaviour exactly (the guest branch
// in the comment routes is simply never taken).
export const DEFAULT_ALLOW_GUEST_COMMENTS = true;

// Alert when this many guest comments are waiting for editorial review (see
// guestCommentAlertService.js). The same alert also fires for any unreviewed
// comment past the 24h review window, whatever the count.
export const DEFAULT_ALERT_THRESHOLD = 10;
export const MAX_ALERT_EMAILS = 10;

function getDefaultSettings() {
  return {
    _id: SETTINGS_ID,
    mode: 'auto',
    delaySeconds: 3,
    allowGuestComments: DEFAULT_ALLOW_GUEST_COMMENTS,
    alertEnabled: true,
    alertThreshold: DEFAULT_ALERT_THRESHOLD,
    alertEmails: [],
    updatedBy: null,
    updatedAt: new Date(),
  };
}

// Docs written before a field existed have no value for it; report the default
// rather than leaving it undefined for callers and the admin UI.
function withDefaults(settings) {
  return {
    ...settings,
    allowGuestComments:
      typeof settings.allowGuestComments === 'boolean'
        ? settings.allowGuestComments
        : DEFAULT_ALLOW_GUEST_COMMENTS,
    alertEnabled:
      typeof settings.alertEnabled === 'boolean' ? settings.alertEnabled : true,
    alertThreshold: Number.isInteger(settings.alertThreshold)
      ? settings.alertThreshold
      : DEFAULT_ALERT_THRESHOLD,
    alertEmails: Array.isArray(settings.alertEmails) ? settings.alertEmails : [],
  };
}

export async function getCommentModerationSettings() {
  const collection =
    await getSystemSettingsCollection();

  let settings =
    await collection.findOne({
      _id: SETTINGS_ID,
    });

  if (!settings) {
    const defaultSettings =
        getDefaultSettings();

    await collection.insertOne(
        defaultSettings
    );

    settings = defaultSettings;
  }

  return withDefaults(settings);
}

export async function updateCommentModerationSettings(
  settings,
  admin
) {
  const collection =
    await getSystemSettingsCollection();

  const $set = {
    mode: settings.mode,

    delaySeconds:
      settings.delaySeconds,

    updatedBy: admin.id,

    updatedAt: new Date(),
  };

  // Each optional field is only written when the caller sent it, so an older
  // admin client saving mode/delay can't silently flip guest commenting or
  // wipe the alert settings.
  if (typeof settings.allowGuestComments === 'boolean') {
    $set.allowGuestComments = settings.allowGuestComments;
  }

  if (typeof settings.alertEnabled === 'boolean') {
    $set.alertEnabled = settings.alertEnabled;
  }

  if (Number.isInteger(settings.alertThreshold)) {
    $set.alertThreshold = settings.alertThreshold;
  }

  if (Array.isArray(settings.alertEmails)) {
    $set.alertEmails = settings.alertEmails;
  }

  await collection.updateOne(
    {
      _id: SETTINGS_ID,
    },
    {
      $set,
    },
    {
      upsert: true,
    }
  );

  return getCommentModerationSettings();
}

/* -------------------------------------------------------
   Helper
------------------------------------------------------- */

export async function isAutoModerationEnabled() {
  const settings =
    await getCommentModerationSettings();

  return {
    enabled:
      settings.mode === 'auto',

    delaySeconds:
      settings.delaySeconds,
  };
}

export async function isGuestCommentingEnabled() {
  const settings =
    await getCommentModerationSettings();

  return settings.allowGuestComments === true;
}
