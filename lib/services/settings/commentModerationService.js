import { getSystemSettingsCollection } from '@/lib/db/systemSettings';

const SETTINGS_ID = 'comment_moderation';

function getDefaultSettings() {
  return {
    _id: SETTINGS_ID,
    mode: 'auto',
    delaySeconds: 3,
    updatedBy: null,
    updatedAt: new Date(),
  };
}

export async function getCommentModerationSettings() {
  const collection =
    await getSystemSettingsCollection();
  
  console.log('Collection OK');

  let settings =
    await collection.findOne({
      _id: SETTINGS_ID,
    });

  console.log('Settings:', settings);

  if (!settings) {
    const defaultSettings =
        getDefaultSettings();

    await collection.insertOne(
        defaultSettings
    );

    settings = defaultSettings;
  }

  return settings;
}

export async function updateCommentModerationSettings(
  settings,
  admin
) {
  const collection =
    await getSystemSettingsCollection();

  await collection.updateOne(
    {
      _id: SETTINGS_ID,
    },
    {
      $set: {
        mode: settings.mode,

        delaySeconds:
          settings.delaySeconds,

        updatedBy: admin.id,

        updatedAt: new Date(),
      },
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