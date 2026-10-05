'use client';

import { Save, Clock3, ShieldCheck, UserRound, BellRing, ShieldAlert, } from 'lucide-react';
import styles from './CommentModerationSettings.module.css';

export function CommentModerationSettings({
  settings,
  setSettings,
  saving,
  onSave,
  captchaStatus = null,
  canEdit = true,
}) {
  const alertEmailsText =
    settings.alertEmailsText ??
    (settings.alertEmails || []).join(', ');

  return (
    <section className={styles.card}>

      {/* A disabled fieldset turns every input and the Save button read-only for
          roles that may view but not change these settings (the API enforces it). */}
      <fieldset
        disabled={!canEdit}
        style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}
      >

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
          Guest commenting
      ---------------------------- */}

      <div className={styles.delaySection}>

        <label className={styles.option}>

          <input
            type="checkbox"
            checked={settings.allowGuestComments === true}
            onChange={(e) =>
              setSettings((prev) => ({
                ...prev,
                allowGuestComments: e.target.checked,
              }))
            }
          />

          <div className={styles.optionContent}>

            <div className={styles.optionTitle}>
              <UserRound
                size={18}
              />

              <span>
                Allow guest comments (no login required)
              </span>
            </div>

            <p className={styles.optionDescription}>
              Visitors can comment and reply without
              signing in. Guest comments are never
              auto-approved: they stay pending until a
              moderator approves them, and are rate-limited
              per visitor. Turn this off to require login
              again. Click Save Settings to apply.
            </p>

          </div>

        </label>

      </div>

      {/* ---------------------------
          CAPTCHA status (environment-controlled, read-only)
      ---------------------------- */}

      {settings.allowGuestComments === true && captchaStatus && (
        <div
          className={`${styles.statusLine} ${
            captchaStatus.configured
              ? styles.statusOk
              : captchaStatus.required
              ? styles.statusError
              : styles.statusWarn
          }`}
        >
          <ShieldAlert size={18} />

          <span>
            {captchaStatus.configured
              ? 'CAPTCHA is active for guest comments (Cloudflare Turnstile).'
              : captchaStatus.required
              ? 'Guest commenting is blocked: CAPTCHA keys are not configured and GUEST_CAPTCHA_REQUIRED is on.'
              : 'CAPTCHA is not configured, so guest comments are not protected against bots. Add TURNSTILE_SITE_KEY and TURNSTILE_SECRET_KEY in the hosting environment, then redeploy.'}
          </span>
        </div>
      )}

      {/* ---------------------------
          Review alerts
      ---------------------------- */}

      <div className={styles.delaySection}>

        <label className={styles.option}>

          <input
            type="checkbox"
            checked={settings.alertEnabled !== false}
            onChange={(e) =>
              setSettings((prev) => ({
                ...prev,
                alertEnabled: e.target.checked,
              }))
            }
          />

          <div className={styles.optionContent}>

            <div className={styles.optionTitle}>
              <BellRing
                size={18}
              />

              <span>
                Email an alert when guest comments pile up unreviewed
              </span>
            </div>

            <p className={styles.optionDescription}>
              An email goes out when the number of live,
              unreviewed guest comments reaches the
              threshold below, or when any guest comment has
              waited more than 24 hours. It repeats at most
              every 6 hours and re-arms once the queue is
              cleared. Click Save Settings to apply.
            </p>

          </div>

        </label>

        <div className={styles.fieldRow}>

          <label className={styles.fieldLabel}>
            Alert threshold (guest comments; 0 = only alert on 24h overdue)
          </label>

          <input
            type="number"
            min={0}
            max={1000}
            value={settings.alertThreshold ?? 10}
            className={styles.delayInput}
            onChange={(e) =>
              setSettings((prev) => ({
                ...prev,
                alertThreshold: Number(e.target.value),
              }))
            }
          />

        </div>

        <div className={styles.fieldRow}>

          <label className={styles.fieldLabel}>
            Alert recipients (comma-separated emails; leave empty to
            email all admins)
          </label>

          <input
            type="text"
            value={alertEmailsText}
            placeholder="editor@example.com, desk@example.com"
            className={styles.textInput}
            onChange={(e) =>
              setSettings((prev) => ({
                ...prev,
                alertEmailsText: e.target.value,
              }))
            }
          />

          {settings.alertLastSentAt && (
            <p className={styles.delayHint}>
              Last alert sent:{' '}
              {new Date(
                settings.alertLastSentAt
              ).toLocaleString()}
            </p>
          )}

        </div>

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

      </fieldset>

      {!canEdit && (
        <p className={styles.delayHint}>
          Only an admin can change these settings.
        </p>
      )}

    </section>
  );
}