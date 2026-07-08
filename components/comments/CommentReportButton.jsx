'use client';

import { useState } from 'react';
import { Flag, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import styles from './Comments.module.css';

export default function CommentReportButton({
  commentId,
  reported = false,
  user,
  onRequireLogin,
  onUpdate,
}) {
  const [loading, setLoading] = useState(false);

  const [isReported, setIsReported] =
    useState(reported);

  async function reportComment() {
    if (!user) {
      onRequireLogin?.();
      return;
    }

    if (isReported) return;

    const reason = window.prompt(
      `Report reason:

Spam
Harassment
Hate Speech
Misinformation
Offensive Content
Copyright
Other

Enter one of the above reasons:`,
      'Other'
    );

    if (reason === null) {
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(
        `/api/comments/${commentId}/report`,
        {
          method: 'POST',

          credentials: 'include',

          headers: {
            'Content-Type':
              'application/json',
          },

          body: JSON.stringify({
            reason,
          }),
        }
      );

      const data = await res.json();

      if (!data.success) {
        toast.error(data.message);

        return;
      }

      setIsReported(true);

      onUpdate?.({
        reported: true,
      });

      toast.success(data.message);

    } catch (error) {
      console.error(error);

      toast.error(
        'Unable to report comment'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      disabled={
        loading ||
        isReported
      }
      onClick={reportComment}
      className={`${styles.actionButton} ${
        styles.reportButton
      } ${
        isReported
          ? styles.reported
          : ''
      }`}
    >
      {loading ? (
        <Loader2
          size={15}
          className="animate-spin"
        />
      ) : (
        <Flag size={15} />
      )}

      <span>
        {isReported
          ? 'Reported'
          : 'Report'}
      </span>
    </button>
  );
}