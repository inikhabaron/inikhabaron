'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { auth, signInWithGoogle, signInWithApple, logOut } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { toast } from 'sonner';
import { Newspaper } from 'lucide-react';

import Header from '@/components/home/Header';
import LatestNews from '@/components/home/LatestNews';
import CategoryShowcase from '@/components/home/CategoryShowcase';
import SiteFooter from '@/components/home/SiteFooter';
import AuthDialog from '@/components/home/AuthDialog';
import MobileSearch from '@/components/home/MobileSearch';
import BookmarkButton from '@/components/bookmarks/BookmarkButton';
import LikeButton from '@/components/likes/LikeButton';
import FollowButton from '@/components/follow/FollowButton';
import { applyFollowChange } from '@/lib/follow/applyFollowChange';
import { CommentsSection } from '@/components/comments';
import { WhySeeingThis } from '@/components/personalization';
import { PersonalizedFeed } from '@/components/personalization';

import useReadingProgress from '@/hooks/useReadingProgress';
import useNewsletterSubscribe from '@/hooks/useNewsletterSubscribe';

import { DarkCtx, FontCtx } from '@/lib/news-contexts';
import { ACCENT, FONT_OPTIONS, translations, getCatAccent, getCatLabel, formatDate } from '@/lib/news-utils';
import styles from './page.module.css';
import { event as trackEvent } from '@/lib/gtag';
import { recordShare } from '@/lib/share';

const Loader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
    <div className="loader" />
  </div>
);

export default function NewsDetailsPage({ initialArticle = null, initialLatest = [] }) {
  const router = useRouter();
  const params = useParams();
  const id = params?.id || initialArticle?.id;
  // Seed state from server-fetched data so the article renders in the initial
  // HTML (SSR) — this is what makes the story crawlable and removes load flicker.
  const [article, setArticle] = useState(initialArticle);
  const [latestNews, setLatestNews] = useState(initialLatest || []);
  const [relatedNews, setRelatedNews] = useState([]);
  const [categories, setCategories] = useState([]);
  const [breakingNews, setBreakingNews] = useState([]);
  const [loading, setLoading] = useState(!initialArticle);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const [selectedFont, setSelectedFont] = useState(FONT_OPTIONS[0]);
  const [textScale] = useState(1);
  const [selectedLanguage, setSelectedLanguage] = useState('hi');
  const [languageLoaded, setLanguageLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const { newsletterEmail, setNewsletterEmail, newsletterLoading, handleNewsletterSubscribe } = useNewsletterSubscribe(selectedLanguage);
  const [isMobileView, setIsMobileView] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [tags, setTags] = useState([]);
  const [following, setFollowing] = useState({ categories: [], authors: [], cities: [] });
  const countedViewRef = useRef(null);

  const t = translations[selectedLanguage];
  const bg = dark ? '#0D1117' : '#F6F7F9';
  const surface = dark ? '#161B27' : '#FFFFFF';
  const bdr = dark ? '#252E40' : '#E8EAED';
  const T1 = dark ? '#E8ECF0' : '#111827';
  const T2 = dark ? '#9BA5B4' : '#4B5563';
  const T3 = '#8A8F98';
  const HEADER_H = isMobileView ? 105 : 204;
  const contentPad = isMobileView ? '12px' : '24px 5px';

  const articleHtml = useMemo(() => {
    if (!article) return '';
    const raw = article.content || article.excerpt || '';
    const trimmed = raw.trim();
    if (!trimmed) return '';
    if (/<[a-z][\s\S]*>/i.test(trimmed)) return trimmed;
    return trimmed
      .split(/\n{2,}/)
      .map(block => `<p>${block.replace(/\n/g, '<br/>')}</p>`)
      .join('');
  }, [article]);

  useEffect(() => {
    let timeout;
    const onResize = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => setIsMobileView(window.innerWidth <= 1159), 150);
    };
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (!languageLoaded) return;
    localStorage.setItem('news_language', selectedLanguage);
  }, [selectedLanguage, languageLoaded]);

  useEffect(() => {
    const saved = localStorage.getItem('news_language');
    setSelectedLanguage(saved || 'hi');
    if (!saved) localStorage.setItem('news_language', 'hi');
    setLanguageLoaded(true);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('newsdesk_dark');
    if (saved === 'true') setDark(true);
    const font = localStorage.getItem('newsdesk_font');
    if (font) {
      const found = FONT_OPTIONS.find(option => option.label === font);
      if (found) setSelectedFont(found);
    }
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) {
      setFollowing({ categories: [], authors: [], cities: [] });
      return;
    }

    let cancelled = false;

    fetch('/api/users/following', { credentials: 'include', cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data.success) setFollowing(data.data);
      })
      .catch((err) => console.error(err));

    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!id) {
      return;
    }

    const load = async () => {
      // Don't flip back to the loader if the server already gave us the article.
      if (!initialArticle) setLoading(true);
      setError(null);
      try {
        const [articleRes, categoryRes, breakingRes, latestRes, tagsRes] = await Promise.all([
          // fetch(`/api/news/${id}?t=${Date.now()}`,{ cache: 'no-store', }), // For testing the word Wrapping
          fetch(`/api/news/${id}`,{ cache: 'no-store', }),
          fetch('/api/categories'),
          fetch('/api/news/breaking', { cache: 'no-store', }),
          fetch('/api/news?page=1&limit=8', { cache: 'no-store', }),
          fetch('/api/tags'),
        ]);

        if (articleRes.status === 404) {
          setError('not-found');
          setArticle(null);
        } else if (!articleRes.ok) {
          throw new Error('Failed to load article');
        } else {
          const articleData = await articleRes.json();
          setArticle(articleData.news || null);
        }

        if (categoryRes.ok) {
          const data = await categoryRes.json();
          setCategories(data.categories || []);
        }
        if (breakingRes.ok) {
          const data = await breakingRes.json();
          setBreakingNews(data.news || []);
        }
        if (latestRes.ok) {
          const data = await latestRes.json();
          setLatestNews(data.news || []);
        }
        if (tagsRes.ok) {
          const data = await tagsRes.json();
          setTags((data.tags || []).filter(tag => tag.active && tag.popular));
        }
      } catch (err) {
        console.error(err);
        if (!error) setError('failed');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  useEffect(() => {
    if (!article?.category) {
      setRelatedNews([]);
      return;
    }

    const loadRelated = async () => {
      try {
        const res = await fetch(`/api/news?category=${encodeURIComponent(article.category)}&limit=6`);
        if (!res.ok) return;
        const data = await res.json();
        setRelatedNews((data.news || []).filter(item => item.id !== article.id).slice(0, 4));
      } catch (err) {
        console.error(err);
      }
    };

    loadRelated();
  }, [article]);

  useEffect(() => {
    if (!article?.id) return;

    // Prevent duplicate counting for the same article render/mount cycle
    if (countedViewRef.current === article.id) {
      return;
    }

    countedViewRef.current = article.id;

    fetch(`/api/news/${article.id}/view`, {
      method: 'POST',
      cache: 'no-store',
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));

        if (!res.ok || !data?.success) {
          console.error('View API failed:', data);

          // allow retry if request failed
          countedViewRef.current = null;
          return;
        }

        if (typeof data.afterViews === 'number') {
          setArticle((prev) => (prev ? { ...prev, views: data.afterViews } : prev));
        }
      })
      .catch((error) => {
        console.error('Failed to record article view:', error);

        // allow retry if request failed
        countedViewRef.current = null;
      });
  }, [article?.id]);

  useEffect(() => {
    const saved = localStorage.getItem('newsdesk_user_id');
    if (!saved) localStorage.setItem('newsdesk_user_id', 'user_' + Math.random().toString(36).substr(2, 9));
  }, []);

  const toggleDark = () => setDark(prev => {
    localStorage.setItem('newsdesk_dark', String(!prev));
    return !prev;
  });

  const handleSearch = (e) => {
    e?.preventDefault();
    router.push('/');
  };

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });

      const r = await logOut();

      if (r.error) {
        toast.error(r.error);
        return;
      }

      setUser(null);

      toast.success('Signed out');
    } catch (err) {
      toast.error('Unable to sign out');
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthLoading(true);

    try {
      const r = await signInWithGoogle();

      if (r.error) {
        toast.error(r.error);
        return;
      }

      // Get Firebase ID Token
      const idToken = await r.user.getIdToken();

      // Create backend session
      const response = await fetch('/api/auth/session', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idToken,
        }),
      });

      const session = await response.json();

      if (!session.success) {
        toast.error(session.message || 'Unable to create session');
        return;
      }

      setUser(r.user);
      setAuthDialogOpen(false);

      toast.success('Signed in!');
    } catch (err) {
      console.error(err);
      toast.error('Unable to sign in');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setAuthLoading(true);

    try {
      const r = await signInWithApple();

      if (r.error) {
        toast.error(r.error);
        return;
      }

      const idToken = await r.user.getIdToken();

      const response = await fetch('/api/auth/session', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idToken,
        }),
      });

      const session = await response.json();

      if (!session.success) {
        toast.error(session.message || 'Unable to create session');
        return;
      }

      setUser(r.user);
      setAuthDialogOpen(false);

      toast.success('Signed in!');
    } catch (err) {
      console.error(err);
      toast.error('Unable to sign in');
    } finally {
      setAuthLoading(false);
    }
  };

  const navigateToArticle = (item) => {
    router.push(`/news/${item.id}`);
  };

  const articleTags = useMemo(() => {
    if (!article?.tags) return [];
    if (Array.isArray(article.tags)) return article.tags;
    return String(article.tags).split(',').map(tag => tag.trim()).filter(Boolean);
  }, [article]);

  const publishedAt = useMemo(() => {
    if (!article?.publishedAt) return '';
    const date = new Date(article.publishedAt);
    return date.toLocaleDateString(selectedLanguage === 'hi' ? 'hi-IN' : 'en-US', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
  }, [article, selectedLanguage]);

  const author = article?.author || article?.authorName || article?.writer || article?.byline;
  const authorLabel = article?.authorLabel || 'Author';
  const isHindi = selectedLanguage === 'hi';

  // Author/category/city are three independent follow relationships — each
  // has its own dedicated button and its own `following` boolean derived
  // straight from the current article, so toggling one never touches another.
  const cityId = article?.location?.districtName || article?.location?.stateName || '';

  const followingAuthor = article?.authorId
    ? following.authors.some((a) => a.id === article.authorId)
    : false;

  const followingCategory = article?.category
    ? following.categories.some((c) => c.id === article.category)
    : false;

  const followingCity = cityId
    ? following.cities.some((c) => c.id === cityId)
    : false;

  const handleAuthorFollowChange = (change) => setFollowing((prev) => applyFollowChange(prev, {
    ...change,
    item: { id: article.authorId, name: author || 'Author', exists: true },
  }));

  const handleCategoryFollowChange = (change) => setFollowing((prev) => applyFollowChange(prev, {
    ...change,
    item: { id: article.category, name: getCatLabel(article.category, selectedLanguage), exists: true },
  }));

  const handleCityFollowChange = (change) => setFollowing((prev) => applyFollowChange(prev, {
    ...change,
    item: { id: cityId, name: cityId, exists: true },
  }));

  const authorFollowLabels = isHindi
    ? { follow: 'लेखक को फॉलो करें', following: 'लेखक को फॉलो कर रहे हैं' }
    : { follow: 'Follow Author', following: 'Following Author' };

  const categoryFollowLabels = isHindi
    ? { follow: 'श्रेणी को फॉलो करें', following: 'श्रेणी को फॉलो कर रहे हैं' }
    : { follow: 'Follow Category', following: 'Following Category' };

  const cityFollowLabels = isHindi
    ? { follow: `${cityId} को फॉलो करें`, following: `${cityId} को फॉलो कर रहे हैं` }
    : { follow: `Follow ${cityId} City`, following: `Following ${cityId}` };

  useReadingProgress({
    articleId: article?.id,
    enabled: !!user,
    ready: !!article && !loading,
  });

  // const trackShare = (newsId, platform) =>
  //   fetch(`/api/news/${newsId}/share`, {
  //     method: 'POST',
  //     headers: {
  //       'Content-Type': 'application/json',
  //     },
  //     body: JSON.stringify({ platform }),
  //   }).catch(console.error);

  return (
    <DarkCtx.Provider value={dark}>
      <FontCtx.Provider value={{ font: selectedFont, scale: textScale }}>
        <div style={{ backgroundColor: bg, color: T1, minHeight: '100vh' }}>
          {isMobileView && showMobileSearch && (
            <MobileSearch
              dark={dark} bdr={bdr} T1={T1} T2={T2} T3={T3}
              searchQuery={searchQuery} setSearchQuery={setSearchQuery}
              tags={tags} news={latestNews} loading={loading}
              isSearchActive={isSearchActive} setIsSearchActive={setIsSearchActive}
              selectedCategory={selectedCategory}
              onClose={() => setShowMobileSearch(false)}
              onSearch={(q) => { setSearchQuery(q); handleSearch(); }}
              onArticleClick={navigateToArticle}
              formatDate={formatDate}
            />
          )}
          <Header
            dark={dark}
            toggleDark={toggleDark}
            selectedLanguage={selectedLanguage}
            setSelectedLanguage={setSelectedLanguage}
            translations={translations}
            user={user}
            onSignIn={() => setAuthDialogOpen(true)}
            onSignOut={handleSignOut}
            categories={categories}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onSearch={handleSearch}
            breakingNews={breakingNews}
            isMobileView={isMobileView}
            setShowMobileSearch={setShowMobileSearch}
            setIsSearchActive={setIsSearchActive}
            t={t}
            surface={surface}
            bdr={bdr}
            T1={T1}
            T2={T2}
            T3={T3}
          />

          <div
            className="kn-page-body"
            style={{
              backgroundColor: bg,
              fontFamily: selectedLanguage === 'hi' ? 'var(--font-devanagari), sans-serif' : selectedFont.value,
              paddingTop: `${HEADER_H}px`,
            }}
          >
            <div className="kn-content-wrap" style={{ padding: contentPad }}>
              {loading ? (
                <div className="kn-loading-wrap">
                  <div className="kn-loading-inner">
                    <Loader />
                    <p style={{ color: T3, fontSize: '14px', marginTop: '10px' }}>{selectedLanguage === 'hi' ? 'लेख लोड हो रहा है...' : 'Loading article...'}</p>
                  </div>
                </div>
              ) : error === 'not-found' ? (
                <div className="kn-empty-state">
                  <Newspaper style={{ width: '44px', height: '44px', color: T3, margin: '0 auto 12px' }} />
                  <p style={{ color: T1, fontSize: '18px', fontWeight: 600, marginBottom: '10px' }}>{selectedLanguage === 'hi' ? 'लेख नहीं मिला' : 'Article not found'}</p>
                  <p style={{ color: T3, fontSize: '14px', marginBottom: '14px' }}>{selectedLanguage === 'hi' ? 'दुर्भाग्यवश यह लेख उपलब्ध नहीं है।' : 'Sorry, this article is unavailable.'}</p>
                  <button
                    onClick={() => router.push('/')}
                    style={{ padding: '10px 18px', borderRadius: '10px', backgroundColor: ACCENT, color: '#fff', border: 'none', cursor: 'pointer' }}
                  >
                    {selectedLanguage === 'hi' ? 'होम पर जाएँ' : 'Go Home'}
                  </button>
                </div>
              ) : article ? (
                <>
                  <div className="kn-desktop-grid" style={{ display: isMobileView ? 'block' : undefined }}>
                    <main style={{ display: 'grid', gap: '24px' }}>
                      <div className={styles.articleHero} style={{ backgroundColor: surface, border: `1px solid ${bdr}` }}>
                        <div className={styles.heroImage}>
                          <img src={article.featuredImage || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200'} alt={article.title} />
                        </div>
                        <div className={styles.articleBody}>
                          <span className={styles.badge} style={{ backgroundColor: getCatAccent(article.category), color: '#fff' }}>
                            {getCatLabel(article.category, selectedLanguage)}
                          </span>
                          <h1 className={styles.articleTitle} style={{ color: T1, fontFamily: selectedLanguage === 'hi' ? 'var(--font-devanagari), sans-serif' : selectedFont.value }}>
                            {article.title}
                          </h1>
                          <div className={styles.articleMeta}>
                            <span>{publishedAt}</span>
                            {(author || article.authorId) && (
                              <span className={styles.articleAuthor} style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                {author && <>{authorLabel}: {author}</>}
                                {article.authorId && (
                                  <FollowButton
                                    type="author"
                                    id={article.authorId}
                                    user={user}
                                    following={followingAuthor}
                                    onRequireLogin={() => setAuthDialogOpen(true)}
                                    onChange={handleAuthorFollowChange}
                                    size="sm"
                                    labels={authorFollowLabels}
                                  />
                                )}
                              </span>
                            )}
                          </div>
                          {article.excerpt && (
                            <p style={{ color: T2, fontSize: '15px', lineHeight: 1.8, marginTop: '16px' }}>{article.excerpt}</p>
                          )}
                          <div className={styles.shareRow}>
                            <BookmarkButton 
                                articleId={article.id}
                                user={user}
                                onRequireLogin={() => setAuthDialogOpen(true)}
                            />
                            <LikeButton
                                articleId={article.id}
                                user={user}
                                onRequireLogin={() => setAuthDialogOpen(true)}
                            />
                            {article.category && (
                              <FollowButton
                                type="category"
                                id={article.category}
                                user={user}
                                following={followingCategory}
                                onRequireLogin={() => setAuthDialogOpen(true)}
                                onChange={handleCategoryFollowChange}
                                labels={categoryFollowLabels}
                              />
                            )}
                            <button className={`${styles.shareBtn} ${styles.whatsapp}`} onClick={async () => {
                              trackEvent({ action: 'share_click', category: 'article', label: 'whatsapp', });

                              await recordShare(article.id, 'whatsapp');
                              window.open(`https://wa.me/?text=${encodeURIComponent('*' + article.title + '*' + '\n\n' + window.location.origin + '/news/' + article.id)}`, '_blank');
                            }}>
                              WhatsApp
                            </button>
                            <button className={`${styles.shareBtn} ${styles.twitter}`} onClick={async () => { 
                              trackEvent({ action: 'share_click', category: 'article', label: 'twitter', });

                              await recordShare(article.id, 'twitter');
                              window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title)}&url=${encodeURIComponent(window.location.origin + '/news/' + article.id)}`, '_blank');
                            }}>
                              X / Twitter
                            </button>
                            <button className={`${styles.shareBtn} ${styles.facebook}`} onClick={async () => { 
                              trackEvent({ action: 'share_click', category: 'article', label: 'facebook', });

                              await recordShare(article.id, 'facebook');
                              window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.origin + '/news/' + article.id)}`, '_blank');
                            }}>
                              Facebook
                            </button>
                          </div>

                          <WhySeeingThis
                            articleId={article.id}
                            title={selectedLanguage === 'hi' ? 'मैं यह क्यों देख रहा हूँ?' : 'Why am I seeing this?'}
                            showMoreLabel={selectedLanguage === 'hi' ? 'और देखें' : 'Show more'}
                            hideLabel={selectedLanguage === 'hi' ? 'छिपाएँ' : 'Hide'}
                          />

                          <article className={styles.articleContent} dangerouslySetInnerHTML={{ __html: articleHtml }} />
                          {article.images?.length > 0 && (
                            <div
                              style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                                gap: '16px',
                                marginTop: '24px'
                              }}
                            >
                              {article.images.map((img, index) => (
                                <img
                                  key={index}
                                  src={typeof img === 'string' ? img : img?.url}
                                  alt={`Gallery ${index + 1}`}
                                  style={{
                                    width: '100%',
                                    height: '220px',
                                    objectFit: 'cover',
                                    borderRadius: '12px'
                                  }}
                                />
                              ))}
                            </div>
                          )}
                          {articleTags.length > 0 && (
                            <div className={styles.tagsRow}>
                              {articleTags.map(tag => (
                                <span key={tag} className={styles.tagItem}>{tag}</span>
                              ))}
                            </div>
                          )}
                          {cityId && (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', padding: '14px 18px', margin: '24px 0', borderRadius: '12px', border: `1px solid ${bdr}`, backgroundColor: surface }}>
                              <span style={{ fontSize: '14px', fontWeight: 600, color: T1 }}>
                                📍 {isHindi ? `${cityId} की खबरें` : `News from ${cityId}`}
                              </span>
                              <FollowButton
                                type="city"
                                id={cityId}
                                user={user}
                                following={followingCity}
                                onRequireLogin={() => setAuthDialogOpen(true)}
                                onChange={handleCityFollowChange}
                                labels={cityFollowLabels}
                              />
                            </div>
                          )}
                          <CommentsSection
                            articleId={article.id}
                            article={article}
                            user={user}
                            onRequireLogin={() => setAuthDialogOpen(true)}
                          />
                          <section style={{ marginTop: '36px' }}>
                            <div className="kn-section-label">
                              <div className="kn-section-label-bar" />
                              <span className="kn-section-label-text" style={{ color: T3 }}>
                                {selectedLanguage === 'hi' ? 'संबंधित लेख' : 'Related articles'}
                              </span>
                            </div>
                            {relatedNews.length === 0 ? (
                              <p style={{ color: T3, marginTop: '12px' }}>{selectedLanguage === 'hi' ? 'कोई संबंधित लेख नहीं मिला।' : 'No related articles found.'}</p>
                            ) : (
                              <div className={styles.relatedGrid}>
                                {relatedNews.map(item => (
                                  <div
                                    key={item.id}
                                    className={styles.relatedCard}
                                    style={{ backgroundColor: dark ? '#161B27' : '#fff', borderColor: dark ? '#252E40' : '#E8EAED' }}
                                    onClick={() => navigateToArticle(item)}
                                  >
                                    <img src={item.featuredImage || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=900'} alt={item.title} />
                                    <div className={styles.relatedCardBody}>
                                      <p className={styles.relatedCardTitle} style={{ color: T1, fontFamily: selectedLanguage === 'hi' ? 'var(--font-devanagari), sans-serif' : selectedFont.value }}>
                                        {item.title}
                                      </p>
                                      <div className={styles.relatedMeta}>
                                        <span style={{ color: T2 }}>{getCatLabel(item.category, selectedLanguage)}</span>
                                        <span style={{ color: T3 }}>{formatDate(item.publishedAt)}</span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </section>
                        </div>
                      </div>
                    </main>

                    <aside className="kn-right-col" style={{ position: isMobileView ? 'static' : 'sticky', top: isMobileView ? 'auto' : `${HEADER_H + 16}px`, marginTop: isMobileView ? '20px' : '0' }}>
                      <LatestNews
                        items={latestNews}
                        onArticleClick={navigateToArticle}
                        dark={dark}
                        selectedLanguage={selectedLanguage}
                        formatDate={formatDate}
                      />
                    </aside>
                  </div>

                  <PersonalizedFeed selectedLanguage={selectedLanguage} />

                  {!isMobileView && categories.length > 0 && (
                    <CategoryShowcase
                      categories={categories}
                      onCategoryClick={setSelectedCategory}
                      dark={dark}
                      selectedLanguage={selectedLanguage}
                    />
                  )}
                </>
              ) : (
                <div className="kn-empty-state">
                  <p style={{ color: T1, fontSize: '16px' }}>{selectedLanguage === 'hi' ? 'लेख लोड नहीं हो सका।' : 'Unable to load article.'}</p>
                </div>
              )}
            </div>
          </div>

          <SiteFooter
            dark={dark}
            categories={categories}
            selectedLanguage={selectedLanguage}
            onCategoryClick={setSelectedCategory}
            newsletterEmail={newsletterEmail}
            setNewsletterEmail={setNewsletterEmail}
            onNewsletterSubscribe={handleNewsletterSubscribe}
            newsletterLoading={newsletterLoading}
          />

          <AuthDialog
            open={authDialogOpen}
            onClose={() => setAuthDialogOpen(false)}
            onGoogleSignIn={handleGoogleSignIn}
            onAppleSignIn={handleAppleSignIn}
            loading={authLoading}
            bdr={bdr}
          />
        </div>
      </FontCtx.Provider>
    </DarkCtx.Provider>
  );
}
