'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Radio } from 'lucide-react';
import PublicPageLayout from '@/components/layout/PublicPageLayout';
import useSiteChrome from '@/hooks/useSiteChrome';
import { refreshIntervalForLiveBlog } from '@/lib/liveBlogs/pollStatus';
import { ACCENT } from '@/lib/news-utils';

const STATUS_LABELS = {
  live: { en: 'Live', hi: 'लाइव', color: '#dc2626' },
  completed: { en: 'Completed', hi: 'समाप्त', color: '#16a34a' },
};

export default function LiveBlogPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug;
  const chrome = useSiteChrome();
  const { selectedLanguage, isMobileView, surface, bdr, T1, T2, T3 } = chrome;
  const isHindi = selectedLanguage === 'hi';

  const [blog, setBlog] = useState(null);
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const pollMsRef = useRef(null);

  const fetchUpdates = useCallback(async (blogId) => {
    try {
      const res = await fetch(`/api/live-blogs/${blogId}/updates?limit=50`, { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) return;
      setUpdates(data.updates || []);
      pollMsRef.current = data.refreshIntervalMs || null;
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/live-blogs/${slug}`, { cache: 'no-store' });
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok || !data.blog) { setNotFound(true); return; }
        setBlog(data.blog);
        pollMsRef.current = refreshIntervalForLiveBlog(data.blog);
        await fetchUpdates(data.blog.id);
      } catch (err) {
        console.error(err);
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [slug, fetchUpdates]);

  // Adaptive polling, same shape as MatchDetailClient.jsx: the interval is
  // re-armed after every tick based on whatever refreshIntervalMs the last
  // response carried (server-controlled), not a fixed client-side value.
  // Stops entirely once the server says there's nothing left to poll for
  // (blog no longer 'live').
  useEffect(() => {
    if (!blog?.id) return;

    let cancelled = false;
    let timeoutId;

    const tick = async () => {
      if (cancelled) return;
      const interval = pollMsRef.current;
      if (!interval) return;
      timeoutId = setTimeout(async () => {
        await fetchUpdates(blog.id);
        tick();
      }, interval);
    };

    tick();
    return () => { cancelled = true; clearTimeout(timeoutId); };
  }, [blog?.id, fetchUpdates]);

  if (notFound) {
    return (
      <PublicPageLayout chrome={chrome}>
        <div style={{ padding: '80px 16px', textAlign: 'center' }}>
          <h1 style={{ fontSize: 20, color: T1 }}>{isHindi ? 'यह लाइव ब्लॉग नहीं मिला' : 'Live blog not found'}</h1>
          <button onClick={() => router.push('/')} style={{ marginTop: 16, padding: '10px 20px', borderRadius: 10, border: 'none', background: ACCENT, color: '#fff', cursor: 'pointer' }}>
            {isHindi ? 'होम पर जाएं' : 'Go home'}
          </button>
        </div>
      </PublicPageLayout>
    );
  }

  if (loading || !blog) {
    return (
      <PublicPageLayout chrome={chrome}>
        <div style={{ padding: '80px 16px', textAlign: 'center', color: T2 }}>
          {isHindi ? 'लोड हो रहा है...' : 'Loading...'}
        </div>
      </PublicPageLayout>
    );
  }

  const statusInfo = STATUS_LABELS[blog.status];

  return (
    <PublicPageLayout chrome={chrome}>
      <div style={{ padding: isMobileView ? '16px 14px 60px' : '28px 5px 70px', maxWidth: 720, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
          <Radio size={18} color={statusInfo?.color || T2} />
          {statusInfo && (
            <span style={{ background: `${statusInfo.color}1F`, color: statusInfo.color, fontSize: 12, fontWeight: 700, padding: '3px 12px', borderRadius: 20 }}>
              {isHindi ? statusInfo.hi : statusInfo.en}
            </span>
          )}
        </div>
        <h1 style={{ fontSize: isMobileView ? 22 : 28, fontWeight: 800, color: T1, margin: '0 0 8px' }}>{blog.title}</h1>
        {blog.summary && <p style={{ fontSize: 14, color: T2, margin: '0 0 24px' }}>{blog.summary}</p>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {updates.map((update) => (
            <div key={update.id} style={{ borderRadius: 12, border: `1px solid ${bdr}`, background: surface, padding: '14px 18px' }}>
              <time style={{ fontSize: 12, color: T3 }}>{new Date(update.publishedAt).toLocaleString()}</time>
              <p style={{ fontSize: 14, color: T1, margin: '6px 0 0', whiteSpace: 'pre-wrap' }}>{update.content}</p>
            </div>
          ))}
          {updates.length === 0 && (
            <div style={{ borderRadius: 12, border: `1px solid ${bdr}`, background: surface, padding: '32px', textAlign: 'center', color: T3, fontSize: 13 }}>
              {isHindi ? 'अभी तक कोई अपडेट नहीं' : 'No updates yet'}
            </div>
          )}
        </div>
      </div>
    </PublicPageLayout>
  );
}
