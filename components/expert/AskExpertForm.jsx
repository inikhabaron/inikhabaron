'use client';

import { useState } from 'react';
import AuthDialog from '@/components/home/AuthDialog';
import useSiteChrome from '@/hooks/useSiteChrome';

// The one interactive island on an otherwise fully server-rendered SEO page
// (app/ask-the-expert/page.js mirrors app/topics/[slug]/page.js — see
// SeoPageShell). Includes its own AuthDialog since SeoPageShell has none —
// same gap TopicFollowButton/AuthorFollowButton already found and fixed.
export default function AskExpertForm({ categories }) {
  const {
    user, sessionReady, selectedLanguage,
    authDialogOpen, setAuthDialogOpen, authLoading,
    handleGoogleSignIn, handleAppleSignIn,
  } = useSiteChrome();

  const [question, setQuestion] = useState('');
  const [category, setCategory] = useState(categories?.[0]?.slug || '');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const isHindi = selectedLanguage === 'hi';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user || !sessionReady) {
      setAuthDialogOpen(true);
      return;
    }
    if (!question.trim() || !category) return;

    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/expert-questions', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: question.trim(), category }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || (isHindi ? 'सवाल भेजने में समस्या हुई।' : 'Unable to submit your question.'));
        return;
      }
      setQuestion('');
      setSubmitted(true);
    } catch (err) {
      setError(isHindi ? 'सवाल भेजने में समस्या हुई।' : 'Unable to submit your question.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ border: '1px solid #E8EAED', borderRadius: 16, padding: 20, marginBottom: 28, background: '#fff' }}>
      <h2 style={{ fontSize: 18, margin: '0 0 12px', color: '#111827' }}>
        {isHindi ? 'अपना सवाल पूछें' : 'Ask a question'}
      </h2>

      {submitted ? (
        <p style={{ color: '#16a34a', margin: 0 }}>
          {isHindi
            ? 'आपका सवाल भेज दिया गया है। जवाब मिलने पर आपको सूचित किया जाएगा।'
            : "Your question has been submitted. We'll notify you when an expert answers."}
        </p>
      ) : (
        <form onSubmit={handleSubmit}>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #E8EAED', marginBottom: 10, fontSize: 14 }}
          >
            {(categories || []).map((cat) => (
              <option key={cat.slug} value={cat.slug}>{cat.name}</option>
            ))}
          </select>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            maxLength={500}
            rows={3}
            placeholder={isHindi ? 'अपना सवाल यहाँ लिखें...' : 'Type your question here...'}
            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #E8EAED', fontSize: 14, resize: 'vertical', marginBottom: 10 }}
          />
          {error && <p style={{ color: '#dc2626', fontSize: 13, margin: '0 0 10px' }}>{error}</p>}
          <button
            type="submit"
            disabled={submitting || !question.trim()}
            style={{ background: '#152a58', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer', opacity: submitting || !question.trim() ? 0.6 : 1 }}
          >
            {submitting ? (isHindi ? 'भेजा जा रहा है...' : 'Submitting…') : (isHindi ? 'सवाल भेजें' : 'Submit Question')}
          </button>
        </form>
      )}

      <AuthDialog
        open={authDialogOpen}
        onClose={() => setAuthDialogOpen(false)}
        onGoogleSignIn={handleGoogleSignIn}
        onAppleSignIn={handleAppleSignIn}
        loading={authLoading}
        bdr="#E8EAED"
      />
    </div>
  );
}
