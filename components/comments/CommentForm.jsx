'use client';

import { useRef, useState } from 'react';
import { Loader2, Send } from 'lucide-react';
import { toast } from 'sonner';

import styles from './Comments.module.css';

const MAX_LENGTH = 1000;
const WARNING_LENGTH = 900;

export default function CommentForm({
  user,
  disabled = false,
  onSubmit,
  onRequireLogin,
}) {
  const [content, setContent] = useState('');

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

    if (!user) {
      onRequireLogin?.();
      return;
    }

    const text = content.trim();

    if (!text) {
      toast.error('Comment cannot be empty.');
      return;
    }

    const result = await onSubmit?.(text);

    if (result?.success) {
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
      <textarea
        ref={textareaRef}
        className={styles.commentTextarea}
        placeholder={
          user
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
            !content.trim()
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