'use client';

import { Save, Clock3, ShieldCheck, } from 'lucide-react';
import styles from './CommentModerationSettings.module.css';

export function CommentModerationSettings({
  settings,
  setSettings,
  saving,
  onSave,
}) {
  return (
    <section className={styles.card}>

      <div className={styles.header}>

        <div>

          <h2 className={styles.title}>
            Comment Moderation
          </h2>

          <p className={styles.subtitle}>
            Configure how new comments are approved
            before becoming visible on the website.
          </p>

        </div>

      </div>

      {/* ---------------------------
          Moderation Mode
      ---------------------------- */}

      <div className={styles.section}>

        <label className={styles.option}>

          <input
            type="radio"
            name="moderationMode"
            checked={settings.mode === 'auto'}
            onChange={() =>
              setSettings((prev) => ({
                ...prev,
                mode: 'auto',
              }))
            }
          />

          <div className={styles.optionContent}>

            <div className={styles.optionTitle}>
              <ShieldCheck
                size={18}
              />

              <span>
                Auto Approval
              </span>
            </div>

            <p className={styles.optionDescription}>
              Comments remain pending briefly,
              then are approved automatically
              after the configured delay.
            </p>

          </div>

        </label>

        <label className={styles.option}>

          <input
            type="radio"
            name="moderationMode"
            checked={settings.mode === 'manual'}
            onChange={() =>
              setSettings((prev) => ({
                ...prev,
                mode: 'manual',
              }))
            }
          />

          <div className={styles.optionContent}>

            <div className={styles.optionTitle}>
              <ShieldCheck
                size={18}
              />

              <span>
                Manual Approval
              </span>
            </div>

            <p className={styles.optionDescription}>
              Comments stay pending until
              a moderator approves them.
            </p>

          </div>

        </label>

      </div>

      {/* ---------------------------
          Delay
      ---------------------------- */}

      <div className={styles.delaySection}>

        <label className={styles.delayLabel}>

          <Clock3 size={18} />

          <span>
            Auto Approval Delay (seconds)
          </span>

        </label>

        <input
          type="number"
          min={0}
          value={settings.delaySeconds}
          disabled={settings.mode === 'manual'}
          className={styles.delayInput}
          onChange={(e) =>
            setSettings((prev) => ({
              ...prev,
              delaySeconds:
                Number(e.target.value),
            }))
          }
        />

        <p className={styles.delayHint}>
          Delay before a pending comment
          is automatically approved.
        </p>

      </div>

      {/* ---------------------------
          Footer
      ---------------------------- */}

      <div className={styles.footer}>

        <button
          className={styles.saveButton}
          onClick={onSave}
          disabled={saving}
        >
          <Save size={18} />

          <span>
            {saving
              ? 'Saving...'
              : 'Save Settings'}
          </span>
        </button>

      </div>

    </section>
  );
}