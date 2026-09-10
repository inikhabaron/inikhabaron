'use client';

import { useEffect, useRef, useState } from 'react';
import { Headphones, Loader2, RotateCcw } from 'lucide-react';

const POLL_MS = 4000;

// A reader's "Listen" click never blocks on generation — it enqueues a job
// (via POST) and polls (via GET) until the article's `audio` field flips to
// ready/failed. No auth: audio is a shared, article-level resource (one
// generated file serves every reader), not a personal one like a bookmark.
export default function ListenToArticle({ articleId, isHindi, surface, bdr, T1, T2, accent }) {
  const [audio, setAudio] = useState(null);
  const [loading, setLoading] = useState(false);
  const pollRef = useRef(null);

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const fetchStatus = async () => {
    try {
      const res = await fetch(`/api/news/${articleId}/audio`);
      if (!res.ok) return;
      const data = await res.json();
      setAudio(data.audio);
      if (data.audio?.status !== 'pending') stopPolling();
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchStatus();
    return stopPolling;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [articleId]);

  useEffect(() => {
    if (audio?.status === 'pending' && !pollRef.current) {
      pollRef.current = setInterval(fetchStatus, POLL_MS);
    }
    return () => {};
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audio?.status]);

  const requestAudio = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/news/${articleId}/audio`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) setAudio(data.audio);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!audio) return null; // Initial GET hasn't resolved yet — nothing to show.

  if (audio.status === 'ready') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 12, border: `1px solid ${bdr}`, background: surface, margin: '16px 0' }}>
        <Headphones size={18} color={accent} />
        <audio controls src={audio.url} style={{ flex: 1, height: 36 }} />
      </div>
    );
  }

  if (audio.status === 'pending') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 12, border: `1px solid ${bdr}`, background: surface, margin: '16px 0', color: T2, fontSize: 13 }}>
        <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
        {isHindi ? 'ऑडियो तैयार किया जा रहा है...' : 'Preparing audio…'}
        <style>{'@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}'}</style>
      </div>
    );
  }

  return (
    <button
      onClick={requestAudio}
      disabled={loading}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 16px', margin: '16px 0',
        borderRadius: 999, border: `1px solid ${bdr}`, background: surface, color: T1,
        fontSize: 13, fontWeight: 600, cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.6 : 1,
      }}
    >
      {audio.status === 'failed' ? <RotateCcw size={16} color={accent} /> : <Headphones size={16} color={accent} />}
      {audio.status === 'failed'
        ? (isHindi ? 'दोबारा कोशिश करें' : 'Try again')
        : (isHindi ? 'सुनें' : 'Listen to Article')}
    </button>
  );
}
