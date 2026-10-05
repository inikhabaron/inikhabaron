'use client';

import { useRef, useState } from 'react';
import { Loader2, Send, X } from 'lucide-react';
import { toast } from 'sonner';

import GuestFields from './GuestFields';
import useGuestIdentity from './useGuestIdentity';

import styles from './CommentActions.module.css';

const MAX_LENGTH = 1000;

export default function ReplyForm({
  user,
  guestAllowed = false,
  formToken = null,
  captcha = null,
  disabled = false,
  onSubmit,
  onCancel,
  onRequireLogin,
}) {
  const [content, setContent] = useState('');

  const guestIdentity = useGuestIdentity();

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
      toast.error('Reply cannot be empty.');
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
        textareaRef.current.style.height = '90px';
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

  return (
    <form
      className={styles.replyForm}
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
        rows={3}
        value={content}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={
          user || asGuest
            ? 'Write a reply...'
            : 'Login to reply...'
        }
        disabled={disabled}
        className={styles.replyTextarea}
      />

      <div className={styles.replyActions}>
        <button
          type="button"
          onClick={onCancel}
          className={styles.replyCancel}
        >
          <X size={16} />
          Cancel
        </button>

        <button
          type="submit"
          disabled={
            disabled ||
            !content.trim() ||
            (asGuest && Boolean(captcha) && !guestIdentity.captchaToken)
          }
          className={styles.replySubmit}
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
              Reply
            </>
          )}
        </button>
      </div>
    </form>
  );
}