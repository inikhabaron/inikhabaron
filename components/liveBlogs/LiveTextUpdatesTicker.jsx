'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { Radio, ChevronRight } from 'lucide-react';

// The "Live Text Updates" surface — the same live_blog_updates feed as the
// full /live-blogs/[slug] page, just embedded inline on an article that
// has isLive && liveBlogId set (see docs/mvp3-phase1-architecture.md,
// "Live Text Updates vs. Live Blogs"). Deliberately one backend, two
// renderings rather than a second feed mechanism.
export default function LiveTextUpdatesTicker({ liveBlogId, isHindi, surface, bdr, T1, T2, T3 }) {
  const [updates, setUpdates] = useState([]);
  const [blogMeta, setBlogMeta] = useState(null);
  const pollMsRef = useRef(null);

  const fetchUpdates = useCallback(async () => {
    try {
      const res = await fetch(`/api/live-blogs/${liveBlogId}/updates?limit=5`, { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) return;
      setUpdates(data.updates || []);
      setBlogMeta(data.blog || null);
      pollMsRef.current = data.refreshIntervalMs || null;
    } catch (err) {
      console.error(err);
    }
  }, [liveBlogId]);

  useEffect(() => {
    if (!liveBlogId) return;
    let cancelled = false;
    let timeoutId;

    const tick = async () => {
      if (cancelled) return;
      await fetchUpdates();
      const interval = pollMsRef.current;
      if (!interval || cancelled) return;
      timeoutId = setTimeout(tick, interval);
    };

    tick();
    return () => { cancelled = true; clearTimeout(timeoutId); };
  }, [liveBlogId, fetchUpdates]);

  if (!liveBlogId || updates.length === 0) return null;

  return (
    <div style={{ borderRadius: 12, border: `1px solid ${bdr}`, background: surface, padding: '16px 18px', margin: '24px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Radio size={16} color="#dc2626" />
          <span style={{ fontSize: 14, fontWeight: 700, color: T1 }}>
            {isHindi ? 'लाइव अपडेट' : 'Live Updates'}
          </span>
        </div>
        {blogMeta?.slug && (
          <Link href={`/live-blogs/${blogMeta.slug}`} style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 12, color: T2, textDecoration: 'none' }}>
            {isHindi ? 'पूरा देखें' : 'View full coverage'}<ChevronRight size={13} />
          </Link>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {updates.slice(0, 3).map((update) => (
          <div key={update.id} style={{ borderLeft: '2px solid #dc2626', paddingLeft: 10 }}>
            <time style={{ fontSize: 11, color: T3 }}>{new Date(update.publishedAt).toLocaleTimeString()}</time>
            <p style={{ fontSize: 13, color: T1, margin: '2px 0 0', whiteSpace: 'pre-wrap' }}>{update.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
