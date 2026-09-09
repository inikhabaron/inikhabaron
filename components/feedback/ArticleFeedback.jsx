'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import styles from './ArticleFeedback.module.css';

/**
 * "Was this article helpful?" widget. Deliberately minimal per the Phase 1
 * scope: a single vote (helpful / not_helpful) plus an optional comment box
 * that only appears after voting. No local restore of a prior vote on
 * reload — there's no GET-my-feedback endpoint in this phase (see
 * docs/mvp3-phase1-architecture.md), so re-voting just updates the same
 * underlying entry (one per user per article) rather than duplicating it.
 */
export default function ArticleFeedback({ articleId, user, onRequireLogin, isHindi, surface, bdr, T1, T2, T3, accent }) {
  const [vote, setVote] = useState(null);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [commentSent, setCommentSent] = useState(false);

  async function submitVote(nextVote) {
    if (!user) {
      onRequireLogin?.();
      return;
    }
    if (loading) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/news/${articleId}/feedback`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vote: nextVote }),
      });
      const data = await res.json();
      if (!data.success) {
        toast.error(data.message || 'Something went wrong');
        return;
      }
      setVote(nextVote);
      setCommentSent(false);
    } catch (err) {
      console.error(err);
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  async function submitComment() {
    if (!comment.trim() || loading) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/news/${articleId}/feedback`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vote, comment: comment.trim() }),
      });
      const data = await res.json();
      if (!data.success) {
        toast.error(data.message || 'Something went wrong');
        return;
      }
      setCommentSent(true);
    } catch (err) {
      console.error(err);
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.wrap} style={{ backgroundColor: surface, borderColor: bdr }}>
      <p className={styles.question} style={{ color: T1 }}>
        {isHindi ? 'क्या यह लेख उपयोगी था?' : 'Was this article helpful?'}
      </p>
      <div className={styles.voteRow}>
        <button
          type="button"
          className={styles.voteBtn}
          disabled={loading}
          onClick={() => submitVote('helpful')}
          style={{
            borderColor: vote === 'helpful' ? accent : bdr,
            color: vote === 'helpful' ? accent : T2,
            background: vote === 'helpful' ? `color-mix(in srgb, ${accent} 12%, transparent)` : 'transparent',
          }}
        >
          👍 {isHindi ? 'उपयोगी' : 'Helpful'}
        </button>
        <button
          type="button"
          className={styles.voteBtn}
          disabled={loading}
          onClick={() => submitVote('not_helpful')}
          style={{
            borderColor: vote === 'not_helpful' ? '#DC2626' : bdr,
            color: vote === 'not_helpful' ? '#DC2626' : T2,
            background: vote === 'not_helpful' ? 'rgba(220,38,38,0.1)' : 'transparent',
          }}
        >
          👎 {isHindi ? 'उपयोगी नहीं' : 'Not Helpful'}
        </button>
      </div>

      {vote && !commentSent && (
        <div className={styles.commentBox}>
          <textarea
            className={styles.textarea}
            style={{ borderColor: bdr, color: T1, background: 'transparent' }}
            value={comment}
            maxLength={1000}
            onChange={(e) => setComment(e.target.value)}
            placeholder={isHindi ? 'हमें और बताएं... (वैकल्पिक)' : 'Tell us more... (optional)'}
          />
          <button
            type="button"
            className={styles.sendBtn}
            disabled={loading || !comment.trim()}
            onClick={submitComment}
            style={{ background: accent, color: '#fff' }}
          >
            {isHindi ? 'भेजें' : 'Send'}
          </button>
        </div>
      )}

      {commentSent && (
        <p className={styles.thanks} style={{ color: T3 }}>
          {isHindi ? 'आपकी प्रतिक्रिया के लिए धन्यवाद!' : 'Thanks for your feedback!'}
        </p>
      )}
    </div>
  );
}
