'use client';

import { useRef, useState } from 'react';
import { Loader2, Send, X } from 'lucide-react';
import { toast } from 'sonner';

import styles from './CommentActions.module.css';

const MAX_LENGTH = 1000;

export default function ReplyForm({
  user,
  disabled = false,
  onSubmit,
  onCancel,
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
      toast.error('Reply cannot be empty.');
      return;
    }

    const result = await onSubmit?.(text);

    if (result?.success) {
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
      <textarea
        ref={textareaRef}
        rows={3}
        value={content}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={
          user
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
            !content.trim()
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