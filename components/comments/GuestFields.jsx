'use client';

import CaptchaWidget from './CaptchaWidget';

import styles from './Comments.module.css';

const NAME_MAX_LENGTH = 40;

/**
 * Extra inputs shown to a logged-out visitor when guest commenting is on: an
 * optional display name, plus a honeypot field that real users never see.
 */
export default function GuestFields({
  name,
  onNameChange,
  website,
  onWebsiteChange,
  disabled = false,
  onRequireLogin,
  captcha = null,
  onCaptchaToken,
  captchaResetKey = 0,
}) {
  return (
    <div className={styles.guestFields}>
      <input
        type="text"
        className={styles.guestNameInput}
        placeholder="Your name (optional)"
        aria-label="Your name (optional)"
        maxLength={NAME_MAX_LENGTH}
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        disabled={disabled}
        autoComplete="nickname"
      />

      <span className={styles.guestNotice}>
        Commenting as a guest. Comments are published immediately and
        reviewed by our editors afterwards; abusive, unlawful or spam
        comments are removed. To prevent abuse we keep an anonymised record
        of your device and network — see our{' '}
        <a
          href="/privacy-policy"
          className={styles.guestLoginLink}
          target="_blank"
          rel="noopener noreferrer"
        >
          Privacy Policy
        </a>
        .
        {onRequireLogin && (
          <>
            {' '}
            <button
              type="button"
              className={styles.guestLoginLink}
              onClick={onRequireLogin}
            >
              Log in instead
            </button>
          </>
        )}
      </span>

      {captcha && (
        <CaptchaWidget
          siteKey={captcha.siteKey}
          onToken={onCaptchaToken}
          resetKey={captchaResetKey}
        />
      )}

      {/* Honeypot: off-screen, unfocusable, ignored by assistive tech. Only
          automated form-fillers populate it. Deliberately NOT named "website" /
          "url" / "company": browser autofill and password managers fill fields
          like that for real people, and a filled honeypot silently drops the
          comment. */}
      <div className={styles.guestHoneypot} aria-hidden="true">
        <label>
          Leave this field empty
          <input
            type="text"
            name="qx_hp_note"
            tabIndex={-1}
            autoComplete="off"
            data-lpignore="true"
            data-1p-ignore="true"
            value={website}
            onChange={(e) => onWebsiteChange(e.target.value)}
          />
        </label>
      </div>
    </div>
  );
}
