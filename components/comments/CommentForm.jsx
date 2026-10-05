'use client';

import { useRef, useState } from 'react';
import { Loader2, Send } from 'lucide-react';
import { toast } from 'sonner';

import GuestFields from './GuestFields';
import useGuestIdentity from './useGuestIdentity';

import styles from './Comments.module.css';

const MAX_LENGTH = 1000;
const WARNING_LENGTH = 900;

export default function CommentForm({
  user,
  guestAllowed = false,
  formToken = null,
  captcha = null,
  disabled = false,
  onSubmit,
  onRequireLogin,
}) {
  const [content, setContent] = useState('');

  const guestIdentity = useGuestIdentity();

  // Logged-in users always comment as themselves; guests only when an admin
  // has enabled guest commenting. Otherwise it's login-only, as before.
  const asGuest = !user && guestAllowed;

  const textareaRef = useRef(null);

  function resizeTextarea() {
    const textarea = textareaRef.current;

    if (!textarea) return;

    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  }

  function handleChange(e) {
    const value = e.target.value;

    if (value.length > MAX_LENGTH) return;

    setContent(value);

    resizeTextarea();
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!user && !asGuest) {
      onRequireLogin?.();
      return;
    }

    const text = content.trim();

    if (!text) {
      toast.error('Comment cannot be empty.');
      return;
    }

    if (asGuest && captcha && !guestIdentity.captchaToken) {
      toast.error('Please complete the verification challenge.');
      return;
    }

    const result = await onSubmit?.(
      text,
      asGuest ? guestIdentity.buildGuestPayload(formToken) : null
    );

    // A CAPTCHA token is single-use, whatever the outcome.
    if (asGuest) guestIdentity.resetCaptcha();

    if (result?.success) {
      if (asGuest) guestIdentity.markSubmitted();

      setContent('');

      if (textareaRef.current) {
        textareaRef.current.style.height = '110px';
      }
    }
  }

  function handleKeyDown(e) {
    if (
      (e.ctrlKey || e.metaKey) &&
      e.key === 'Enter'
    ) {
      handleSubmit(e);
    }
  }

  const remaining =
    MAX_LENGTH - content.length;

  return (
    <form
      className={styles.commentForm}
      onSubmit={handleSubmit}
    >
      {asGuest && (
        <GuestFields
          name={guestIdentity.name}
          onNameChange={guestIdentity.setName}
          website={guestIdentity.website}
          onWebsiteChange={guestIdentity.setWebsite}
          disabled={disabled}
          onRequireLogin={onRequireLogin}
          captcha={captcha}
          onCaptchaToken={guestIdentity.setCaptchaToken}
          captchaResetKey={guestIdentity.captchaResetKey}
        />
      )}

      <textarea
        ref={textareaRef}
        className={styles.commentTextarea}
        placeholder={
          user || asGuest
            ? 'Join the discussion...'
            : 'Login to write a comment...'
        }
        value={content}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        rows={4}
      />

      <div className={styles.formFooter}>
        <div
          className={`${styles.characterCount} ${
            content.length >= WARNING_LENGTH
              ? styles.warning
              : ''
          }`}
        >
          {content.length}/{MAX_LENGTH}
        </div>

        <button
          type="submit"
          disabled={
            disabled ||
            !content.trim() ||
            (asGuest && Boolean(captcha) && !guestIdentity.captchaToken)
          }
          className={styles.submitButton}
        >
          {disabled ? (
            <>
              <Loader2
                size={16}
                className="animate-spin"
              />
              Posting...
            </>
          ) : (
            <>
              <Send size={16} />
              Post Comment
            </>
          )}
        </button>
      </div>

      <div className={styles.formHint}>
        Press{' '}
        <strong>Ctrl + Enter</strong>{' '}
        (or{' '}
        <strong>⌘ + Enter</strong>{' '}
        on Mac) to post your comment.
      </div>
    </form>
  );
}