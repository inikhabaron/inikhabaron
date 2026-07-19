'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, FolderOpen, UserPen, MapPin } from 'lucide-react';

import FollowButton from '@/components/follow/FollowButton';
import PublicPageLayout from '@/components/layout/PublicPageLayout';
import { applyFollowChange } from '@/lib/follow/applyFollowChange';
import useSiteChrome from '@/hooks/useSiteChrome';
import { ACCENT, ACCENT_H } from '@/lib/news-utils';

export default function FollowingPage() {
  const router = useRouter();
  const chrome = useSiteChrome();
  const {
    dark, selectedLanguage, user, setAuthDialogOpen,
    isMobileView, surface, bdr, T1, T2, T3,
  } = chrome;

  const isHindi = selectedLanguage === 'hi';

  const [authRequired, setAuthRequired] = useState(false);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState({ categories: [], authors: [], cities: [] });
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadFollowing() {
      try {
        setLoading(true);
        setError('');

        const response = await fetch('/api/users/following', { credentials: 'include', cache: 'no-store' });

        if (response.status === 401) {
          if (active) {
            setAuthRequired(true);
            router.replace('/?authRequired=1&redirect=%2Ffollowing');
          }
          return;
        }

        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.message || 'Unable to load your following list.');
        if (!active) return;
        setFollowing(data.data || { categories: [], authors: [], cities: [] });
      } catch (err) {
        if (active) setError(err.message || 'Unable to load your following list.');
      } finally {
        if (active) setLoading(false);
      }
    }

    loadFollowing();
    return () => { active = false; };
  }, []);

  const followLabels = isHindi ? { follow: 'फॉलो करें', following: 'फॉलो कर रहे हैं' } : undefined;

  function handleUnfollow(type, item) {
    return (change) => setFollowing((prev) => applyFollowChange(prev, { ...change, item }));
  }

  if (authRequired) {
    return (
      <PublicPageLayout chrome={chrome}>
        <div className="kn-content-wrap" style={{ padding: '60px 16px', display: 'flex', justifyContent: 'center' }}>
          <div style={{ maxWidth: 420, width: '100%', borderRadius: 16, background: surface, border: `1px solid ${bdr}`, padding: 32, textAlign: 'center' }}>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: T1, margin: '0 0 8px' }}>
              {isHindi ? 'साइन इन आवश्यक है' : 'Sign in required'}
            </h1>
            <p style={{ fontSize: 14, color: T2, margin: 0 }}>
              {isHindi ? 'आपको साइन इन पेज पर भेजा जा रहा है...' : 'Redirecting you to sign in...'}
            </p>
          </div>
        </div>
      </PublicPageLayout>
    );
  }

  const isEmpty = !loading && following.categories.length === 0 && following.authors.length === 0 && following.cities.length === 0;

  const sections = [
    {
      key: 'categories',
      icon: FolderOpen,
      title: isHindi ? 'फॉलो की गई श्रेणियाँ' : 'Followed Categories',
      items: following.categories,
      render: (c) => ({
        label: isHindi ? (c.nameHi || c.name || c.id) : (c.name || c.id),
        dot: c.color,
      }),
    },
    {
      key: 'authors',
      icon: UserPen,
      title: isHindi ? 'फॉलो किए गए लेखक' : 'Followed Authors',
      items: following.authors,
      render: (a) => ({ label: a.name || a.id, avatar: a.avatar }),
    },
    {
      key: 'cities',
      icon: MapPin,
      title: isHindi ? 'फॉलो किए गए शहर' : 'Followed Cities',
      items: following.cities,
      render: (c) => ({ label: c.name || c.id }),
    },
  ];

  return (
    <PublicPageLayout chrome={chrome}>
    <div className="kn-content-wrap" style={{ padding: isMobileView ? '16px 14px 60px' : '28px 5px 70px', maxWidth: 760 }}>

      {/* Hero */}
      <section
        style={{
          borderRadius: 18,
          padding: isMobileView ? '24px 20px' : '32px 36px',
          marginBottom: 24,
          background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_H})`,
          color: '#fff',
          boxShadow: '0 16px 40px rgba(21,42,88,0.28)',
        }}
      >
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.16)', padding: '6px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 14 }}>
          <Users size={14} />
          {isHindi ? 'फॉलो' : 'Following'}
        </div>
        <h1 style={{ fontSize: isMobileView ? 22 : 28, fontWeight: 800, margin: '0 0 8px', lineHeight: 1.25 }}>
          {isHindi ? 'आप जिन्हें फॉलो करते हैं' : 'Who and what you follow'}
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.85)', margin: 0, fontSize: 14, maxWidth: 480 }}>
          {isHindi
            ? 'श्रेणियाँ, लेखक और शहर — यहाँ से अनफॉलो करें।'
            : 'Categories, authors, and cities — unfollow any of them right from here.'}
        </p>
      </section>

      {error && (
        <div style={{ padding: '14px 18px', borderRadius: 12, background: dark ? 'rgba(239,68,68,0.1)' : '#FEF2F2', border: `1px solid ${dark ? 'rgba(239,68,68,0.3)' : '#FECACA'}`, marginBottom: 20 }}>
          <span style={{ fontSize: 13, color: '#EF4444', fontWeight: 500 }}>{error}</span>
        </div>
      )}

      {loading ? (
        <div style={{ borderRadius: 16, background: surface, border: `1px solid ${bdr}`, padding: 24 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0', borderBottom: i < 2 ? `1px solid ${bdr}` : 'none' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: bdr }} />
              <div style={{ flex: 1, height: 14, borderRadius: 4, background: bdr }} />
            </div>
          ))}
        </div>
      ) : isEmpty ? (
        <div style={{ borderRadius: 16, background: surface, border: `1px solid ${bdr}`, padding: '48px 24px', textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: dark ? 'rgba(59,175,218,0.14)' : '#EBF8FF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Users size={26} color={ACCENT} />
          </div>
          <div style={{ fontSize: 19, fontWeight: 700, color: T1, marginBottom: 8 }}>
            {isHindi ? 'आप अभी किसी को फॉलो नहीं कर रहे' : 'You aren’t following anything yet'}
          </div>
          <p style={{ color: T2, margin: '0 0 20px', fontSize: 14, maxWidth: 400, marginInline: 'auto' }}>
            {isHindi ? 'श्रेणियों, लेखकों और शहरों को फॉलो करें ताकि यहाँ दिखाई दें।' : 'Follow categories, authors, and cities to see them here.'}
          </p>
          <button
            onClick={() => router.push('/')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 22px', borderRadius: 12, border: 'none', background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_H})`, color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
          >
            {isHindi ? 'खबरें देखें' : 'Explore News'}
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {sections.filter(s => s.items.length > 0).map((section) => {
            const SectionIcon = section.icon;
            return (
              <section key={section.key} style={{ borderRadius: 16, background: surface, border: `1px solid ${bdr}`, padding: isMobileView ? 18 : 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <SectionIcon size={18} color={T2} />
                  <h2 style={{ fontSize: 15, fontWeight: 700, color: T1, margin: 0 }}>{section.title}</h2>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {section.items.map((item) => {
                    const display = section.render(item);
                    return (
                      <div
                        key={item.id}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '10px 14px', borderRadius: 12, border: `1px solid ${bdr}`, flexWrap: 'wrap' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                          {display.dot && (
                            <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: display.dot, flexShrink: 0 }} />
                          )}
                          {display.avatar && (
                            <img src={display.avatar} alt={display.label} style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                          )}
                          <span style={{ fontSize: 14, fontWeight: 600, color: T1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {display.label}
                          </span>
                          {item.exists === false && (
                            <span style={{ fontSize: 11, color: T3 }}>
                              {isHindi ? '(अब उपलब्ध नहीं)' : '(no longer available)'}
                            </span>
                          )}
                        </div>
                        <FollowButton
                          type={section.key === 'categories' ? 'category' : section.key === 'authors' ? 'author' : 'city'}
                          id={item.id}
                          user={user}
                          following={true}
                          size="sm"
                          onRequireLogin={() => setAuthDialogOpen(true)}
                          onChange={handleUnfollow(section.key, item)}
                          labels={followLabels}
                        />
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
    </PublicPageLayout>
  );
}
