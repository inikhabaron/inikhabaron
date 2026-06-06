'use client';

import React, { useEffect, useMemo, useState } from 'react';
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

import { DarkCtx, FontCtx } from '@/lib/news-contexts';
import { ACCENT, FONT_OPTIONS, translations, getCatAccent, getCatLabel, formatDate } from '@/lib/news-utils';
import styles from './page.module.css';

const Loader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
    <div className="loader" />
  </div>
);

export default function NewsDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;
  const [article, setArticle] = useState(null);
  const [latestNews, setLatestNews] = useState([]);
  const [relatedNews, setRelatedNews] = useState([]);
  const [categories, setCategories] = useState([]);
  const [breakingNews, setBreakingNews] = useState([]);
  const [loading, setLoading] = useState(true);
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
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterLoading, setNewsletterLoading] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [tags, setTags] = useState([]);

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
    const unsub = onAuthStateChanged(auth, setUser);
    return unsub;
  }, []);

  useEffect(() => {
    if (!id) {
      return;
    }

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [articleRes, categoryRes, breakingRes, latestRes, tagsRes] = await Promise.all([
          fetch(`/api/news/${id}`),
          fetch('/api/categories'),
          fetch('/api/news/breaking'),
          fetch('/api/news?page=1&limit=8'),
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
    const result = await logOut();
    if (result.error) toast.error(result.error);
    else { setUser(null); toast.success('Signed out'); }
  };

  const handleGoogleSignIn = async () => {
    setAuthLoading(true);
    const result = await signInWithGoogle();
    if (result.error) toast.error(result.error);
    else { setUser(result.user); setAuthDialogOpen(false); toast.success('Signed in!'); }
    setAuthLoading(false);
  };

  const handleAppleSignIn = async () => {
    setAuthLoading(true);
    const result = await signInWithApple();
    if (result.error) toast.error(result.error);
    else { setUser(result.user); setAuthDialogOpen(false); toast.success('Signed in!'); }
    setAuthLoading(false);
  };

  const handleNewsletterSubscribe = async () => {
    if (!newsletterEmail.trim()) {
      toast.error(selectedLanguage === 'hi' ? 'ईमेल दर्ज करें' : 'Please enter email');
      return;
    }
    try {
      setNewsletterLoading(true);
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newsletterEmail }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(selectedLanguage === 'hi' ? 'सफलतापूर्वक सब्सक्राइब किया गया' : 'Subscribed!');
        setNewsletterEmail('');
      } else {
        toast.error(data.error || 'Something went wrong');
      }
    } catch (err) {
      console.error(err);
      toast.error('Server error');
    } finally {
      setNewsletterLoading(false);
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
                            {author && <span className={styles.articleAuthor}>{selectedLanguage === 'hi' ? 'रचित:' : 'By'} {author}</span>}
                          </div>
                          {article.excerpt && (
                            <p style={{ color: T2, fontSize: '15px', lineHeight: 1.8, marginTop: '16px' }}>{article.excerpt}</p>
                          )}
                          <div className={styles.shareRow}>
                            <button className={`${styles.shareBtn} ${styles.whatsapp}`} onClick={() => {
                              window.open(`https://wa.me/?text=${encodeURIComponent(article.title + '\n\n' + window.location.origin + '/news/' + article.id)}`, '_blank');
                            }}>
                              WhatsApp
                            </button>
                            <button className={`${styles.shareBtn} ${styles.twitter}`} onClick={() => {
                              window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title)}&url=${encodeURIComponent(window.location.origin + '/news/' + article.id)}`, '_blank');
                            }}>
                              X / Twitter
                            </button>
                            <button className={`${styles.shareBtn} ${styles.facebook}`} onClick={() => {
                              window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.origin + '/news/' + article.id)}`, '_blank');
                            }}>
                              Facebook
                            </button>
                          </div>
                          <article className={styles.articleContent} dangerouslySetInnerHTML={{ __html: articleHtml }} />
                          {articleTags.length > 0 && (
                            <div className={styles.tagsRow}>
                              {articleTags.map(tag => (
                                <span key={tag} className={styles.tagItem}>{tag}</span>
                              ))}
                            </div>
                          )}
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
