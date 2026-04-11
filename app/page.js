'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { auth, signInWithGoogle, signInWithApple, logOut } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import {
  Search, Menu, X, Clock, Eye, ChevronRight, Newspaper,
  Bell, User, Bookmark, Building, Trophy, Briefcase, Film,
  Laptop, MapPin, Flag, Globe, Loader2, AlertCircle,
  ExternalLink, Crown, CheckCircle, Image as ImageIcon,
  ChevronDown, Settings, HelpCircle, LogOut as LogOutIcon,
  Music, Plane, Share2, ArrowUp, ArrowDown, Sun, Moon,
  MessageCircle, Type, ChevronUp,
} from 'lucide-react';

// ─── Font options for the toolbar ─────────────────────────────────────────────
const FONT_OPTIONS = [
  { label: 'Inter',         value: "'Inter', sans-serif",                google: 'Inter:wght@300;400;500;600;700;800' },
  { label: 'Poppins',       value: "'Poppins', sans-serif",              google: 'Poppins:wght@300;400;500;600;700;800' },
  { label: 'Roboto',        value: "'Roboto', sans-serif",               google: 'Roboto:wght@300;400;500;700;900' },
  { label: 'DM Sans',       value: "'DM Sans', sans-serif",              google: 'DM+Sans:wght@300;400;500;600;700' },
  { label: 'Nunito Sans',   value: "'Nunito Sans', sans-serif",          google: 'Nunito+Sans:wght@300;400;600;700;800' },
  { label: 'Plus Jakarta',  value: "'Plus Jakarta Sans', sans-serif",    google: 'Plus+Jakarta+Sans:wght@300;400;500;600;700' },
  { label: 'SF Pro',        value: "-apple-system, 'SF Pro Display', 'Helvetica Neue', sans-serif", google: null },
  { label: 'Helvetica',     value: "'Helvetica Neue', Helvetica, Arial, sans-serif",                google: null },
];

const SIZE_OPTIONS = [
  { label: 'S',  scale: 0.875 },
  { label: 'M',  scale: 1 },
  { label: 'L',  scale: 1.125 },
  { label: 'XL', scale: 1.25 },
];

// ─── Category config ───────────────────────────────────────────────────────────
const categoryIcons = {
  politics: Building, sports: Trophy, business: Briefcase,
  entertainment: Film, technology: Laptop, local: MapPin,
  national: Flag, world: Globe,
};

const ACCENT   = '#3BAFDA';
const ACCENT_H = '#2B9FC8'; // hover

const getCatAccent = (cat) => {
  const map = { sport:'#3BAFDA', sports:'#3BAFDA', health:'#38b2ac', business:'#ed8936', food:'#e53e3e', travel:'#48bb78', politics:'#805ad5', technology:'#319795', entertainment:'#d69e2e' };
  return map[(cat||'').toLowerCase()] || ACCENT;
};

// ─── Session ID ────────────────────────────────────────────────────────────────
const getSessionId = () => {
  if (typeof window === 'undefined') return 'server';
  let s = localStorage.getItem('newsdesk_session');
  if (!s) { s = 'sess_' + Math.random().toString(36).substr(2, 9); localStorage.setItem('newsdesk_session', s); }
  return s;
};

const DarkCtx    = React.createContext(false);
const FontCtx    = React.createContext({ font: FONT_OPTIONS[0], scale: 1 });

// ─── Ad Components ────────────────────────────────────────────────────────────
const ProgrammaticAd = ({ placement, size = '728x90' }) => {
  const dark = React.useContext(DarkCtx);
  useEffect(() => {
    fetch('/api/ads/impression', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ adId: `prog_${placement}_${Date.now()}`, adType: 'programmatic', placement, sessionId: getSessionId(), estimatedRevenue: 0.002 }) }).catch(() => {});
  }, [placement]);
  const [, height] = size.split('x').map(Number);
  return (
    <div style={{ height, width: '100%', backgroundColor: dark ? '#1e2130' : '#F5F6F8', border: `1px dashed ${dark ? '#2e3347' : '#E6E8EB'}`, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ fontSize: '11px', fontWeight: 500, color: '#8A8F98', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Advertisement</span>
    </div>
  );
};

const NativeAd = () => {
  const dark = React.useContext(DarkCtx);
  useEffect(() => {
    fetch('/api/ads/impression', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ adId: `native_${Date.now()}`, adType: 'native', placement: 'in-article', sessionId: getSessionId(), estimatedRevenue: 0.005 }) }).catch(() => {});
  }, []);
  return (
    <div style={{ backgroundColor: dark ? '#1e2130' : '#F5F6F8', border: `1px solid ${dark ? '#2e3347' : '#E6E8EB'}`, borderRadius: '10px', padding: '14px 16px' }}>
      <span style={{ fontSize: '10px', fontWeight: 600, color: '#8A8F98', backgroundColor: dark ? '#2e3347' : '#E6E8EB', padding: '2px 8px', borderRadius: '4px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Sponsored</span>
      <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
        <div style={{ width: '52px', height: '52px', borderRadius: '8px', backgroundColor: dark ? '#2e3347' : '#dde0e6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <ImageIcon style={{ width: '20px', height: '20px', color: '#8A8F98' }} />
        </div>
        <div>
          <p style={{ fontSize: '13px', fontWeight: 600, color: dark ? '#d1d5db' : '#333', marginBottom: '3px' }}>Premium Content Partner</p>
          <p style={{ fontSize: '12px', color: '#8A8F98', lineHeight: 1.5 }}>Discover exclusive offers from our trusted partners.</p>
        </div>
      </div>
    </div>
  );
};

// ─── Subscription Plans Modal ─────────────────────────────────────────────────
const SubscriptionPlans = ({ open, onClose }) => {
  const dark = React.useContext(DarkCtx);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (open) fetch('/api/subscriptions/plans').then(r => r.json()).then(d => { setPlans(d.plans || []); setLoading(false); }).catch(() => setLoading(false));
  }, [open]);
  const bdr = dark ? '#2e3347' : '#E6E8EB';
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent style={{ maxWidth: '860px', borderRadius: '16px', padding: '32px' }}>
        <DialogHeader><DialogTitle style={{ fontSize: '20px', fontWeight: 700, color: dark ? '#e5e7eb' : '#333', textAlign: 'center' }}>Choose Your Plan</DialogTitle></DialogHeader>
        {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><Loader2 style={{ width: '28px', height: '28px', color: ACCENT, animation: 'spin 1s linear infinite' }} /></div> : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', padding: '20px 0' }}>
            {plans.map((plan) => (
              <div key={plan.id} style={{ border: `2px solid ${plan.popular ? ACCENT : bdr}`, borderRadius: '12px', padding: '20px', position: 'relative', backgroundColor: plan.popular ? (dark ? 'rgba(59,175,218,0.08)' : 'rgba(59,175,218,0.04)') : 'transparent' }}>
                {plan.popular && <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', backgroundColor: ACCENT, color: 'white', fontSize: '10px', fontWeight: 700, padding: '3px 12px', borderRadius: '20px', whiteSpace: 'nowrap' }}>Most Popular</div>}
                <p style={{ fontWeight: 700, fontSize: '14px', color: dark ? '#e5e7eb' : '#333', marginBottom: '8px' }}>{plan.name}</p>
                <p style={{ fontSize: '24px', fontWeight: 800, color: ACCENT, marginBottom: '4px' }}>{plan.price === 0 ? 'Free' : `₹${plan.price}`}{plan.price > 0 && <span style={{ fontSize: '13px', color: '#8A8F98', fontWeight: 400 }}>/{plan.period}</span>}</p>
                <ul style={{ listStyle: 'none', margin: '12px 0', padding: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {plan.features.map((f, i) => <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '12px', color: dark ? '#9ca3af' : '#555' }}><CheckCircle style={{ width: '13px', height: '13px', color: '#38a169', flexShrink: 0, marginTop: '1px' }} />{f}</li>)}
                </ul>
                <button style={{ width: '100%', padding: '8px', borderRadius: '8px', border: plan.popular ? 'none' : `1px solid ${bdr}`, backgroundColor: plan.popular ? ACCENT : 'transparent', color: plan.popular ? 'white' : dark ? '#9ca3af' : '#555', fontSize: '13px', fontWeight: 600, cursor: plan.id === 'free' ? 'default' : 'pointer', opacity: plan.id === 'free' ? 0.6 : 1 }} disabled={plan.id === 'free'}>{plan.id === 'free' ? 'Current Plan' : 'Subscribe'}</button>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

// ─── Article Card (grid) ──────────────────────────────────────────────────────
const ArticleCard = ({ item, onClick, formatDate }) => {
  const dark = React.useContext(DarkCtx);
  const { scale } = React.useContext(FontCtx);
  const catColor = getCatAccent(item.category);
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={() => onClick(item)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ cursor: 'pointer', backgroundColor: dark ? '#1e2130' : '#FFFFFF', border: `1px solid ${dark ? '#2e3347' : '#E6E8EB'}`, borderRadius: '12px', overflow: 'hidden', transition: 'box-shadow 0.2s, transform 0.2s', boxShadow: hovered ? '0 6px 20px rgba(0,0,0,0.09)' : '0 1px 3px rgba(0,0,0,0.04)', transform: hovered ? 'translateY(-2px)' : 'none' }}
    >
      <div style={{ position: 'relative', height: '186px', overflow: 'hidden', backgroundColor: dark ? '#2e3347' : '#F0F2F5' }}>
        <img src={item.featuredImage || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600'} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s', transform: hovered ? 'scale(1.04)' : 'scale(1)' }} />
        {item.isBreaking && (
          <span style={{ position: 'absolute', top: '10px', right: '10px', backgroundColor: '#e53e3e', color: 'white', fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '20px', letterSpacing: '0.04em' }}>BREAKING</span>
        )}
      </div>
      <div style={{ padding: '14px 16px 16px' }}>
        <p style={{ fontSize: `${11 * scale}px`, fontWeight: 600, color: catColor, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{item.category}</p>
        <h3 style={{ fontSize: `${15 * scale}px`, fontWeight: 700, color: dark ? '#e2e8f0' : '#2d3748', lineHeight: 1.4, marginBottom: '10px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.title}</h3>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
            <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: dark ? '#2e3347' : '#F0F2F5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <User style={{ width: '11px', height: '11px', color: '#8A8F98' }} />
            </div>
            <span style={{ fontSize: `${12 * scale}px`, fontWeight: 400, color: '#8A8F98', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.authorName || 'NewsDesk'}</span>
            <span style={{ color: dark ? '#3e4557' : '#D1D5DB', fontSize: '14px' }}>·</span>
            <span style={{ fontSize: `${11 * scale}px`, fontWeight: 300, color: '#8A8F98', flexShrink: 0, whiteSpace: 'nowrap' }}>{formatDate(item.publishedAt)}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0 }}>
            <button onClick={(e) => e.stopPropagation()} style={{ padding: '5px', border: 'none', background: 'none', cursor: 'pointer', borderRadius: '6px', color: '#8A8F98', transition: 'background 0.15s' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = dark ? '#2e3347' : '#F0F2F5'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
              <Bookmark style={{ width: '14px', height: '14px' }} />
            </button>
            <button onClick={(e) => e.stopPropagation()} style={{ padding: '5px', border: 'none', background: 'none', cursor: 'pointer', borderRadius: '6px', color: '#8A8F98', transition: 'background 0.15s' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = dark ? '#2e3347' : '#F0F2F5'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
              <Share2 style={{ width: '14px', height: '14px' }} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Right sidebar trending item ──────────────────────────────────────────────
const TrendingItem = ({ item, onClick, dark, scale }) => (
  <div onClick={() => onClick(item)} style={{ display: 'flex', gap: '10px', padding: '10px 0', cursor: 'pointer', borderBottom: `1px solid ${dark ? '#2e3347' : '#F0F2F5'}` }}
    onMouseEnter={e => e.currentTarget.style.opacity = '0.75'} onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
    <div style={{ width: '52px', height: '52px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, backgroundColor: dark ? '#2e3347' : '#F0F2F5' }}>
      <img src={item.featuredImage || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=200'} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <p style={{ fontSize: `${11 * scale}px`, fontWeight: 600, color: getCatAccent(item.category), textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3px' }}>{item.category}</p>
      <p style={{ fontSize: `${13 * scale}px`, fontWeight: 500, color: dark ? '#d1d5db' : '#333', lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.title}</p>
    </div>
  </div>
);

// ─── Font Toolbar ─────────────────────────────────────────────────────────────
const FontToolbar = ({ selectedFont, onFontChange, selectedSize, onSizeChange, dark }) => {
  const bdr = dark ? '#2e3347' : '#E6E8EB';
  const bg  = dark ? '#1e2130' : '#FFFFFF';
  const txt = dark ? '#d1d5db' : '#333';
  return (
    <div style={{ padding: '12px 16px', borderTop: `1px solid ${bdr}`, borderBottom: `1px solid ${bdr}`, backgroundColor: bg }}>
      {/* Font family */}
      <div style={{ marginBottom: '10px' }}>
        <p style={{ fontSize: '10px', fontWeight: 600, color: '#8A8F98', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>Font Family</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {FONT_OPTIONS.map(f => (
            <button
              key={f.label}
              onClick={() => onFontChange(f)}
              style={{
                padding: '6px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer', textAlign: 'left',
                backgroundColor: selectedFont.label === f.label ? (dark ? 'rgba(59,175,218,0.15)' : '#EBF8FF') : 'transparent',
                color: selectedFont.label === f.label ? ACCENT : txt,
                fontSize: '13px', fontFamily: f.value, fontWeight: selectedFont.label === f.label ? 600 : 400,
                transition: 'background-color 0.15s',
              }}
              onMouseEnter={e => { if (selectedFont.label !== f.label) e.currentTarget.style.backgroundColor = dark ? 'rgba(255,255,255,0.05)' : '#F5F6F8'; }}
              onMouseLeave={e => { if (selectedFont.label !== f.label) e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>
      {/* Text size */}
      <div>
        <p style={{ fontSize: '10px', fontWeight: 600, color: '#8A8F98', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>Text Size</p>
        <div style={{ display: 'flex', gap: '4px' }}>
          {SIZE_OPTIONS.map(s => (
            <button key={s.label} onClick={() => onSizeChange(s.scale)}
              style={{ flex: 1, padding: '5px 0', borderRadius: '6px', border: `1px solid ${selectedSize === s.scale ? ACCENT : bdr}`, backgroundColor: selectedSize === s.scale ? (dark ? 'rgba(59,175,218,0.15)' : '#EBF8FF') : 'transparent', color: selectedSize === s.scale ? ACCENT : '#8A8F98', fontSize: '12px', fontWeight: selectedSize === s.scale ? 700 : 500, cursor: 'pointer', transition: 'all 0.15s' }}>
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────
export default function HomePage() {
  const [news, setNews] = useState([]);
  const [breakingNews, setBreakingNews] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNews, setSelectedNews] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [subscriptionDialogOpen, setSubscriptionDialogOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [userId, setUserId] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [readingHistory, setReadingHistory] = useState([]);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [youtubeLive, setYoutubeLive] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [dark, setDark] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedFont, setSelectedFont] = useState(FONT_OPTIONS[0]);
  const [textScale, setTextScale] = useState(1);
  const [showFontToolbar, setShowFontToolbar] = useState(false);
  const contentRef = useRef(null);

  // persist prefs
  useEffect(() => {
    const d = localStorage.getItem('newsdesk_dark');
    if (d === 'true') setDark(true);
    const f = localStorage.getItem('newsdesk_font');
    if (f) { const found = FONT_OPTIONS.find(o => o.label === f); if (found) setSelectedFont(found); }
    const sz = localStorage.getItem('newsdesk_size');
    if (sz) setTextScale(parseFloat(sz));
  }, []);

  const toggleDark = () => setDark(p => { localStorage.setItem('newsdesk_dark', String(!p)); return !p; });
  const handleFontChange = (f) => { setSelectedFont(f); localStorage.setItem('newsdesk_font', f.label); };
  const handleSizeChange = (s) => { setTextScale(s); localStorage.setItem('newsdesk_size', s); };

  useEffect(() => { const u = onAuthStateChanged(auth, setUser); return u; }, []);
  const handleSignOut = async () => { const r = await logOut(); if (r.error) toast.error(r.error); else { setUser(null); toast.success('Signed out'); } };

  useEffect(() => { const s = localStorage.getItem('newsdesk_user_id'); if (s) setUserId(s); else { const id = 'user_' + Math.random().toString(36).substr(2, 9); localStorage.setItem('newsdesk_user_id', id); setUserId(id); } }, []);
  useEffect(() => { if (userId) fetch(`/api/users/${userId}/history`).then(r => r.json()).then(d => setReadingHistory(d.history || [])).catch(() => {}); }, [userId]);

  const handleGoogleSignIn = async () => { setAuthLoading(true); const r = await signInWithGoogle(); if (r.error) toast.error(r.error); else { setUser(r.user); setAuthDialogOpen(false); toast.success('Signed in!'); } setAuthLoading(false); };
  const handleAppleSignIn = async () => { setAuthLoading(true); const r = await signInWithApple(); if (r.error) toast.error(r.error); else { setUser(r.user); setAuthDialogOpen(false); toast.success('Signed in!'); } setAuthLoading(false); };

  const fetchCategories = useCallback(async () => { try { const r = await fetch('/api/categories'); const d = await r.json(); setCategories(d.categories || []); } catch (e) { console.error(e); } }, []);
  const fetchNews = useCallback(async (cat = 'all', search = '', pageNum = 1) => {
    try {
      setLoading(true);
      let url = `/api/news?page=${pageNum}&limit=20`;
      if (cat && cat !== 'all') url += `&category=${cat}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      const r = await fetch(url); const d = await r.json();
      if (pageNum === 1) setNews(d.news || []); else setNews(p => [...p, ...(d.news || [])]);
      setHasMore(d.pagination?.page < d.pagination?.pages);
    } catch (e) { console.error(e); toast.error('Failed to load news'); } finally { setLoading(false); }
  }, []);
  const fetchBreakingNews = useCallback(async () => { try { const r = await fetch('/api/news/breaking'); const d = await r.json(); setBreakingNews(d.news || []); } catch (e) { console.error(e); } }, []);
  const fetchYoutubeLive = useCallback(async () => { try { const r = await fetch('/api/youtube/live'); const d = await r.json(); if (d.configured) setYoutubeLive(d); } catch (e) { console.error(e); } }, []);
  const seedData = useCallback(async () => { try { await fetch('/api/seed', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }); } catch (e) { console.error(e); } }, []);

  useEffect(() => { const init = async () => { await seedData(); await fetchCategories(); await fetchBreakingNews(); await fetchNews(); fetchYoutubeLive(); }; init(); }, [seedData, fetchCategories, fetchBreakingNews, fetchNews, fetchYoutubeLive]);
  useEffect(() => { setPage(1); fetchNews(selectedCategory, searchQuery, 1); }, [selectedCategory, fetchNews, searchQuery]);

  const handleSearch = (e) => { e.preventDefault(); setPage(1); fetchNews(selectedCategory, searchQuery, 1); };
  const loadMore = () => { const n = page + 1; setPage(n); fetchNews(selectedCategory, searchQuery, n); };

  const handleScroll = useCallback(() => {
    if (contentRef.current && selectedNews) {
      const el = contentRef.current;
      setScrollPosition(Math.min(Math.round((el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100), 100));
    }
  }, [selectedNews]);

  const saveReadingProgress = useCallback(async () => {
    if (selectedNews && userId && scrollPosition > 0) {
      try {
        await fetch('/api/users/reading-history', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, newsId: selectedNews.id, newsTitle: selectedNews.title, newsExcerpt: selectedNews.excerpt, newsFeaturedImage: selectedNews.featuredImage, newsCategory: selectedNews.category, scrollPosition, readPercentage: scrollPosition }) });
        const r = await fetch(`/api/users/${userId}/history`); const d = await r.json(); setReadingHistory(d.history || []);
      } catch (e) { console.error(e); }
    }
  }, [selectedNews, userId, scrollPosition]);

  const handleCloseArticle = () => { saveReadingProgress(); setSelectedNews(null); setScrollPosition(0); };
  const handleContinueReading = async (item) => { try { const r = await fetch(`/api/news/${item.newsId}`); const d = await r.json(); if (d.news) setSelectedNews({ ...d.news, initialScrollPosition: item.scrollPosition }); } catch { toast.error('Failed to load'); } };

  const trackShare = async (newsId, platform) => { try { await fetch(`/api/news/${newsId}/share`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ platform }) }); } catch (e) { console.error(e); } };
  const shareOnWhatsApp = (item) => { const u = `${window.location.origin}/news/${item.id}`; window.open(`https://wa.me/?text=${encodeURIComponent(item.title + '\n\n' + u)}`, '_blank'); trackShare(item.id, 'whatsapp'); toast.success('Opening WhatsApp...'); };
  const shareOnTwitter = (item) => { const u = `${window.location.origin}/news/${item.id}`; window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(item.title)}&url=${encodeURIComponent(u)}`, '_blank'); trackShare(item.id, 'twitter'); };
  const shareOnFacebook = (item) => { const u = `${window.location.origin}/news/${item.id}`; window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(u)}`, '_blank'); trackShare(item.id, 'facebook'); };

  const formatDate = (ds) => {
    if (!ds) return '';
    const date = new Date(ds); const diff = Date.now() - date;
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getCategoryIcon = (slug) => categoryIcons[slug] || Newspaper;

  // ── Palette ───────────────────────────────────────────────────────────────────
  const bg         = dark ? '#141620'   : '#F5F6F8';
  const surface    = dark ? '#1e2130'   : '#FFFFFF';
  const surfaceAlt = dark ? '#252838'   : '#F0F2F5';
  const bdr        = dark ? '#2e3347'   : '#E6E8EB';
  const T1         = dark ? '#e2e8f0'   : '#1a202c';   // primary text
  const T2         = dark ? '#9ca3af'   : '#4a5568';   // secondary text
  const T3         = '#8A8F98';                         // muted / metadata
  const hoverBg    = dark ? '#252838'   : '#F5F6F8';

  const navItems = [
    { label: 'Latest News', slug: 'all' },
    { label: 'Politics',    slug: 'politics' },
    { label: 'Business',    slug: 'business' },
    { label: 'Sports',      slug: 'sports' },
    { label: 'Technology',  slug: 'technology' },
  ];

  const leftNavItems = [
    { label: 'News',    icon: Newspaper,  slug: 'all' },
    { label: 'Movies',  icon: Film,       slug: 'entertainment' },
    { label: 'Music',   icon: Music,      slug: null },
    { label: 'Travel',  icon: Plane,      slug: 'local' },
    { label: 'Sports',  icon: Trophy,     slug: 'sports' },
  ];

  const trendingCategories = categories.map((cat, i) => ({
    name: cat.name,
    views: [60250, 45000, 24500, 9850, 5250][i] || 1000,
    trend: [true, false, true, false, true][i],
    icon: getCategoryIcon(cat.slug),
    slug: cat.slug,
  }));

  const allTags = [...new Set(news.flatMap(n => n.tags || []))].slice(0, 14);

  // Inject dynamic font Google link
  useEffect(() => {
    if (!selectedFont.google) return;
    const id = 'dynamic-gfont';
    let el = document.getElementById(id);
    if (!el) { el = document.createElement('link'); el.id = id; el.rel = 'stylesheet'; document.head.appendChild(el); }
    el.href = `https://fonts.googleapis.com/css2?family=${selectedFont.google}&display=swap`;
  }, [selectedFont]);

  return (
    <DarkCtx.Provider value={dark}>
      <FontCtx.Provider value={{ font: selectedFont, scale: textScale }}>
        <div style={{ minHeight: '100vh', backgroundColor: bg, fontFamily: selectedFont.value, display: 'flex' }}>

          {/* ═══ LEFT SIDEBAR ══════════════════════════════════════════════════ */}
          <aside style={{
            width: sidebarCollapsed ? '60px' : '210px',
            minWidth: sidebarCollapsed ? '60px' : '210px',
            backgroundColor: surface,
            borderRight: `1px solid ${bdr}`,
            display: 'flex', flexDirection: 'column',
            position: 'sticky', top: 0, height: '100vh',
            transition: 'width 0.22s ease, min-width 0.22s ease',
            zIndex: 40, overflowY: 'auto', overflowX: 'hidden',
          }}>

            {/* ── Logo row FIXED ── */}
            <div style={{
              padding: '18px 14px 14px',
              borderBottom: `1px solid ${bdr}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: sidebarCollapsed ? 'center' : 'space-between'
            }}>

              {/* Logo */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '7px',
                  backgroundColor: ACCENT,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Newspaper style={{ width: '14px', height: '14px', color: 'white' }} />
                </div>

                {!sidebarCollapsed && (
                  <span style={{
                    fontSize: '17px',
                    fontWeight: 800,
                    color: T1,
                    letterSpacing: '-0.3px'
                  }}>
                    NewsDesk
                  </span>
                )}
              </div>

              {/* Hamburger ONLY in expanded */}
              {!sidebarCollapsed && (
                <button
                  onClick={() => setSidebarCollapsed(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px',
                    borderRadius: '6px',
                    color: T3
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = T2}
                  onMouseLeave={e => e.currentTarget.style.color = T3}
                >
                  <Menu style={{ width: '18px', height: '18px' }} />
                </button>
              )}
            </div>

            {/* ── Collapsed layout (Logo → Hamburger BELOW) ── */}
            {sidebarCollapsed && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 0'
              }}>
                <button
                  onClick={() => setSidebarCollapsed(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: T3
                  }}
                >
                  <Menu style={{ width: '18px', height: '18px' }} />
                </button>
              </div>
            )}

            {/* User profile */}
            <div style={{ padding: '12px 14px', borderBottom: `1px solid ${bdr}`, flexShrink: 0 }}>
              {user ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ color: 'white', fontSize: '13px', fontWeight: 700 }}>{(user.displayName || user.email || 'U')[0].toUpperCase()}</span>
                  </div>
                  {!sidebarCollapsed && (
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: '13px', fontWeight: 600, color: T1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.displayName || user.email?.split('@')[0]}</p>
                      <p style={{ fontSize: '11px', color: ACCENT, fontWeight: 500 }}>Premium Plan</p>
                    </div>
                  )}
                </div>
              ) : (
                <Dialog open={authDialogOpen} onOpenChange={setAuthDialogOpen}>
                  <DialogTrigger asChild>
                    <button style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'none', border: 'none', cursor: 'pointer', width: '100%', padding: 0 }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: surfaceAlt, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <User style={{ width: '15px', height: '15px', color: T3 }} />
                      </div>
                      {!sidebarCollapsed && <span style={{ fontSize: '13px', fontWeight: 600, color: T2 }}>Sign In</span>}
                    </button>
                  </DialogTrigger>
                  <DialogContent style={{ borderRadius: '16px', padding: '28px' }}>
                    <DialogHeader><DialogTitle style={{ color: T1, fontWeight: 700 }}>Sign in to NewsDesk</DialogTitle></DialogHeader>
                    <div style={{ paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <button style={{ border: `1px solid ${bdr}`, borderRadius: '8px', padding: '10px 16px', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', backgroundColor: surface, color: T2, fontFamily: selectedFont.value }} onClick={handleGoogleSignIn} disabled={authLoading}>
                        {authLoading ? <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite', color: ACCENT }} /> : <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>}
                        Continue with Google
                      </button>
                      <button style={{ border: `1px solid ${bdr}`, borderRadius: '8px', padding: '10px 16px', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', backgroundColor: surface, color: T2, fontFamily: selectedFont.value }} onClick={handleAppleSignIn} disabled={authLoading}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
                        Continue with Apple
                      </button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            {/* Main nav links */}
            <nav style={{ padding: '10px 8px', flex: 1, overflowY: 'auto' }}>
              {leftNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = item.slug === selectedCategory;
                return (
                  <button key={item.label} onClick={() => item.slug && setSelectedCategory(item.slug)}
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '9px 10px', borderRadius: '8px', border: 'none', cursor: 'pointer', marginBottom: '2px', backgroundColor: isActive ? (dark ? 'rgba(59,175,218,0.12)' : '#EBF8FF') : 'transparent', color: isActive ? ACCENT : T3, transition: 'all 0.15s', justifyContent: sidebarCollapsed ? 'center' : 'flex-start' }}
                    onMouseEnter={e => { if (!isActive) { e.currentTarget.style.backgroundColor = hoverBg; e.currentTarget.style.color = T2; } }}
                    onMouseLeave={e => { if (!isActive) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = T3; } }}>
                    <Icon style={{ width: '17px', height: '17px', flexShrink: 0 }} />
                    {!sidebarCollapsed && <span style={{ fontSize: '14px', fontWeight: isActive ? 600 : 500 }}>{item.label}</span>}
                  </button>
                );
              })}

              <div style={{ height: '1px', backgroundColor: bdr, margin: '10px 4px' }} />

              {[
                { label: 'Account', icon: User, action: null },
                { label: 'Settings', icon: Settings, action: null },
                { label: 'Help & Support', icon: HelpCircle, action: null },
                { label: 'Log Out', icon: LogOutIcon, action: handleSignOut },
              ].map(({ label, icon: Icon, action }) => (
                <button key={label} onClick={action || undefined}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '9px 10px', borderRadius: '8px', border: 'none', cursor: 'pointer', marginBottom: '2px', backgroundColor: 'transparent', color: T3, transition: 'all 0.15s', justifyContent: sidebarCollapsed ? 'center' : 'flex-start' }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = hoverBg; e.currentTarget.style.color = T2; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = T3; }}>
                  <Icon style={{ width: '17px', height: '17px', flexShrink: 0 }} />
                  {!sidebarCollapsed && <span style={{ fontSize: '14px', fontWeight: 500 }}>{label}</span>}
                </button>
              ))}

              {/* Admin */}
              <button onClick={() => window.location.href = '/admin'}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '9px 10px', borderRadius: '8px', border: 'none', cursor: 'pointer', backgroundColor: 'transparent', color: T3, transition: 'all 0.15s', justifyContent: sidebarCollapsed ? 'center' : 'flex-start' }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = hoverBg; e.currentTarget.style.color = T2; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = T3; }}>
                <Building style={{ width: '17px', height: '17px', flexShrink: 0 }} />
                {!sidebarCollapsed && <><span style={{ fontSize: '14px', fontWeight: 500, flex: 1, textAlign: 'left' }}>Admin Panel</span><ExternalLink style={{ width: '12px', height: '12px', opacity: 0.5 }} /></>}
              </button>
            </nav>

            {/* ── Font Toolbar (above dark mode toggle) ── */}
            {!sidebarCollapsed && (
              <>
                {/* Toolbar trigger */}
                <button onClick={() => setShowFontToolbar(p => !p)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', border: 'none', borderTop: `1px solid ${bdr}`, backgroundColor: 'transparent', cursor: 'pointer', color: T3, transition: 'background-color 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = hoverBg}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Type style={{ width: '15px', height: '15px' }} />
                    <span style={{ fontSize: '12px', fontWeight: 600, color: T2 }}>Typography</span>
                  </div>
                  {showFontToolbar ? <ChevronDown style={{ width: '14px', height: '14px' }} /> : <ChevronUp style={{ width: '14px', height: '14px' }} />}
                </button>

                {/* Expanded font toolbar */}
                {showFontToolbar && (
                  <FontToolbar
                    selectedFont={selectedFont} onFontChange={handleFontChange}
                    selectedSize={textScale} onSizeChange={handleSizeChange}
                    dark={dark}
                  />
                )}

                {/* Dark mode toggle */}
                <div style={{ padding: '12px 16px', borderTop: `1px solid ${bdr}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {dark ? <Moon style={{ width: '14px', height: '14px', color: T3 }} /> : <Sun style={{ width: '14px', height: '14px', color: T3 }} />}
                    <span style={{ fontSize: '13px', fontWeight: 500, color: T2 }}>Dark mode</span>
                  </div>
                  <button onClick={toggleDark}
                    style={{ width: '40px', height: '22px', borderRadius: '11px', border: 'none', cursor: 'pointer', backgroundColor: dark ? ACCENT : '#CBD5E0', position: 'relative', transition: 'background-color 0.2s', flexShrink: 0 }}>
                    <span style={{ position: 'absolute', top: '3px', left: dark ? '21px' : '3px', width: '16px', height: '16px', borderRadius: '50%', backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.3)', transition: 'left 0.2s' }} />
                  </button>
                </div>
              </>
            )}

            {/* Collapsed state: just dark toggle icon */}
            {sidebarCollapsed && (
              <div style={{ padding: '12px', borderTop: `1px solid ${bdr}`, display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
                <button onClick={toggleDark} style={{ padding: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer', backgroundColor: 'transparent', color: T3 }} onMouseEnter={e => e.currentTarget.style.backgroundColor = hoverBg} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                  {dark ? <Moon style={{ width: '16px', height: '16px' }} /> : <Sun style={{ width: '16px', height: '16px' }} />}
                </button>
              </div>
            )}
          </aside>

          {/* ═══ CENTER CONTENT ════════════════════════════════════════════════ */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

            {/* Top nav bar */}
            <header style={{ backgroundColor: surface, borderBottom: `1px solid ${bdr}`, padding: '0 24px', display: 'flex', alignItems: 'center', height: '54px', position: 'sticky', top: 0, zIndex: 30 }}>
              <nav style={{ display: 'flex', alignItems: 'center', flex: 1, overflowX: 'auto', gap: 0 }}>
                {navItems.map((item) => {
                  const isActive = selectedCategory === item.slug;
                  return (
                    <button key={item.slug} onClick={() => setSelectedCategory(item.slug)}
                      style={{ padding: '0 16px', height: '54px', border: 'none', cursor: 'pointer', backgroundColor: 'transparent', fontSize: `${14 * textScale}px`, fontWeight: isActive ? 600 : 500, fontFamily: selectedFont.value, color: isActive ? ACCENT : T3, borderBottom: `2px solid ${isActive ? ACCENT : 'transparent'}`, whiteSpace: 'nowrap', transition: 'all 0.15s', flexShrink: 0 }}
                      onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = T2; }}
                      onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = T3; }}>
                      {item.label}
                    </button>
                  );
                })}
                {categories.length > 5 && (
                  <button style={{ padding: '0 14px', height: '54px', border: 'none', cursor: 'pointer', backgroundColor: 'transparent', fontSize: `${14 * textScale}px`, fontWeight: 500, fontFamily: selectedFont.value, color: T3, borderBottom: '2px solid transparent', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    More <ChevronDown style={{ width: '13px', height: '13px' }} />
                  </button>
                )}
              </nav>
              {/* Header right */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '16px', flexShrink: 0 }}>
                <button style={{ width: '32px', height: '32px', borderRadius: '50%', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: surfaceAlt, color: T3, position: 'relative' }}>
                  <Bell style={{ width: '16px', height: '16px' }} />
                  {breakingNews.length > 0 && <span style={{ position: 'absolute', top: '6px', right: '6px', width: '7px', height: '7px', backgroundColor: '#e53e3e', borderRadius: '50%', border: `2px solid ${surface}` }} />}
                </button>
                <button style={{ width: '32px', height: '32px', borderRadius: '50%', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: surfaceAlt, color: T3 }}>
                  <MessageCircle style={{ width: '16px', height: '16px' }} />
                </button>
                <form onSubmit={handleSearch}>
                  <div style={{ position: 'relative' }}>
                    <Search style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)', width: '13px', height: '13px', color: T3 }} />
                    <input type="search" placeholder="Type to search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                      style={{ backgroundColor: surfaceAlt, border: `1px solid ${bdr}`, borderRadius: '8px', padding: '6px 12px 6px 28px', fontSize: '13px', color: T1, outline: 'none', width: '200px', fontFamily: selectedFont.value, transition: 'border-color 0.15s' }}
                      onFocus={e => e.target.style.borderColor = ACCENT}
                      onBlur={e => e.target.style.borderColor = bdr} />
                  </div>
                </form>
              </div>
            </header>

            {/* Breaking ticker */}
            {breakingNews.length > 0 && (
              <div style={{ backgroundColor: dark ? '#1a2535' : '#EBF8FF', borderBottom: `1px solid ${dark ? '#2a3d55' : '#BEE3F8'}`, padding: '6px 24px', overflow: 'hidden', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ backgroundColor: '#e53e3e', color: 'white', fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px', fontFamily: selectedFont.value, letterSpacing: '0.05em' }}>
                  <span style={{ width: '5px', height: '5px', backgroundColor: 'white', borderRadius: '50%', display: 'inline-block', animation: 'pulse 1s infinite' }} />BREAKING
                </span>
                <div style={{ overflow: 'hidden', flex: 1 }}>
                  <div className="animate-marquee" style={{ whiteSpace: 'nowrap', color: dark ? '#90cdf4' : '#2c5282', fontSize: `${13 * textScale}px`, fontWeight: 500, fontFamily: selectedFont.value }}>
                    {[...breakingNews, ...breakingNews].map((item, i) => (
                      <span key={`${item.id}-${i}`} style={{ marginRight: '48px' }}>{item.title}<span style={{ opacity: 0.4, margin: '0 20px' }}>◆</span></span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Feed */}
            <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>

              {/* YouTube live */}
              {youtubeLive?.videoId && (
                <div style={{ marginBottom: '24px', borderRadius: '12px', overflow: 'hidden', border: `1px solid ${bdr}`, backgroundColor: surface }}>
                  <div style={{ backgroundColor: '#111', padding: '8px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#e53e3e', fontSize: '12px', fontWeight: 700 }}>● LIVE</span>
                    <span style={{ color: '#9ca3af', fontSize: '12px' }}>{youtubeLive.title}</span>
                  </div>
                  <div style={{ position: 'relative', paddingBottom: '40%' }}>
                    <iframe className="absolute inset-0 w-full h-full" src={`https://www.youtube.com/embed/${youtubeLive.videoId}?rel=0`} title="Live" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                  </div>
                </div>
              )}

              {/* Hero */}
              {news.length > 0 && !loading && (() => {
                const hero = news[0];
                return (
                  <div onClick={() => setSelectedNews(hero)}
                    style={{ position: 'relative', borderRadius: '14px', overflow: 'hidden', marginBottom: '28px', cursor: 'pointer', height: '320px', border: `1px solid ${bdr}` }}>
                    <img src={hero.featuredImage || 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200'} alt={hero.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.72) 45%, rgba(0,0,0,0.08) 100%)' }} />
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '22px 24px' }}>
                      <span style={{ fontSize: `${11 * textScale}px`, fontWeight: 600, color: 'white', backgroundColor: getCatAccent(hero.category), padding: '3px 10px', borderRadius: '20px', textTransform: 'capitalize', letterSpacing: '0.04em', fontFamily: selectedFont.value }}>{hero.category}</span>
                      <h1 style={{ color: 'white', fontSize: `${20 * textScale}px`, fontWeight: 700, lineHeight: 1.35, margin: '10px 0 12px', fontFamily: selectedFont.value }}>{hero.title}</h1>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <User style={{ width: '11px', height: '11px', color: 'white' }} />
                          </div>
                          <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: `${12 * textScale}px`, fontFamily: selectedFont.value, fontWeight: 400 }}>{hero.authorName || 'NewsDesk'}</span>
                          <span style={{ color: 'rgba(255,255,255,0.4)' }}>·</span>
                          <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: `${11 * textScale}px`, fontFamily: selectedFont.value, fontWeight: 300 }}>{formatDate(hero.publishedAt)}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {[Bookmark, Share2].map((Icon, i) => (
                            <button key={i} onClick={(e) => e.stopPropagation()} style={{ background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: '6px', padding: '6px 8px', cursor: 'pointer', color: 'white', backdropFilter: 'blur(4px)' }}>
                              <Icon style={{ width: '13px', height: '13px' }} />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Grid */}
              {loading && news.length === 0 ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <Loader2 style={{ width: '28px', height: '28px', color: ACCENT, animation: 'spin 1s linear infinite', margin: '0 auto 10px' }} />
                    <p style={{ color: T3, fontSize: `${14 * textScale}px` }}>Loading articles...</p>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
                    {news.slice(1).map((item, idx) => (
                      <React.Fragment key={item.id}>
                        <ArticleCard item={item} onClick={setSelectedNews} formatDate={formatDate} />
                        {(idx + 1) % 6 === 0 && idx !== news.length - 2 && (
                          <div style={{ gridColumn: '1 / -1' }}><NativeAd /></div>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                  {hasMore && (
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '28px' }}>
                      <button onClick={loadMore} disabled={loading}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 22px', borderRadius: '8px', border: `1px solid ${bdr}`, backgroundColor: surface, color: T2, fontSize: `${13 * textScale}px`, fontWeight: 500, cursor: 'pointer', fontFamily: selectedFont.value, transition: 'border-color 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = ACCENT}
                        onMouseLeave={e => e.currentTarget.style.borderColor = bdr}>
                        {loading ? <Loader2 style={{ width: '14px', height: '14px', animation: 'spin 1s linear infinite', color: ACCENT }} /> : <><span>Load more</span><ChevronDown style={{ width: '14px', height: '14px' }} /></>}
                      </button>
                    </div>
                  )}
                  {news.length === 0 && !loading && (
                    <div style={{ textAlign: 'center', padding: '60px 0' }}>
                      <Newspaper style={{ width: '44px', height: '44px', color: T3, margin: '0 auto 12px' }} />
                      <p style={{ color: T1, fontSize: `${15 * textScale}px`, fontWeight: 600, marginBottom: '4px' }}>No articles found</p>
                      <p style={{ color: T3, fontSize: `${13 * textScale}px` }}>{searchQuery ? 'Try different search terms' : 'Check back later'}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* ═══ RIGHT SIDEBAR ════════════════════════════════════════════════ */}
          <aside style={{ width: '288px', minWidth: '288px', backgroundColor: surface, borderLeft: `1px solid ${bdr}`, overflowY: 'auto', padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: '22px', position: 'sticky', top: 0, height: '100vh' }}>

            {/* Trending News */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <h3 style={{ fontSize: `${15 * textScale}px`, fontWeight: 700, color: T1, fontFamily: selectedFont.value }}>Trending News</h3>
                <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: ACCENT, padding: '4px', borderRadius: '4px' }}>
                  <ChevronRight style={{ width: '16px', height: '16px' }} />
                </button>
              </div>
              <div>
                {(breakingNews.length > 0 ? breakingNews : news).slice(0, 6).map((item) => (
                  <TrendingItem key={item.id} item={item} onClick={setSelectedNews} dark={dark} scale={textScale} />
                ))}
              </div>
            </div>

            <div style={{ height: '1px', backgroundColor: bdr }} />

            {/* Trending Sections */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <h3 style={{ fontSize: `${15 * textScale}px`, fontWeight: 700, color: T1, fontFamily: selectedFont.value }}>Trending Sections</h3>
                <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: ACCENT, padding: '4px' }}><ChevronRight style={{ width: '16px', height: '16px' }} /></button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {trendingCategories.slice(0, 5).map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <button key={cat.slug} onClick={() => setSelectedCategory(cat.slug)}
                      style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: 0, background: 'none', border: 'none', cursor: 'pointer', width: '100%' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: surfaceAlt, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon style={{ width: '15px', height: '15px', color: ACCENT }} />
                      </div>
                      <span style={{ flex: 1, fontSize: `${13 * textScale}px`, fontWeight: 500, color: T2, textAlign: 'left', fontFamily: selectedFont.value }}>{cat.name}</span>
                      <span style={{ fontSize: `${11 * textScale}px`, color: T3, fontWeight: 300 }}>{(cat.views / 1000).toFixed(cat.views > 10000 ? 0 : 1)}k</span>
                      {cat.trend
                        ? <ArrowUp style={{ width: '13px', height: '13px', color: '#38a169' }} />
                        : <ArrowDown style={{ width: '13px', height: '13px', color: '#e53e3e' }} />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ height: '1px', backgroundColor: bdr }} />

            {/* Popular Tags */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <h3 style={{ fontSize: `${15 * textScale}px`, fontWeight: 700, color: T1, fontFamily: selectedFont.value }}>Popular Tags</h3>
                <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: T3, fontSize: '18px', lineHeight: 1, padding: '2px' }}>+</button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
                {(allTags.length > 0 ? allTags : ['Politics','Advertising','News','Development','Design','Finance','Football','Future','Travel','Technology','Food','Architecture','Tennis','Video']).map((tag) => (
                  <button key={tag}
                    style={{ padding: '4px 11px', borderRadius: '20px', border: `1px solid ${bdr}`, backgroundColor: 'transparent', color: T2, fontSize: `${12 * textScale}px`, fontWeight: 400, cursor: 'pointer', transition: 'all 0.15s', fontFamily: selectedFont.value }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.color = ACCENT; e.currentTarget.style.backgroundColor = dark ? 'rgba(59,175,218,0.08)' : '#EBF8FF'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = bdr; e.currentTarget.style.color = T2; e.currentTarget.style.backgroundColor = 'transparent'; }}>
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* CTA */}
            <button onClick={() => setSubscriptionDialogOpen(true)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px', borderRadius: '10px', border: 'none', backgroundColor: ACCENT, color: 'white', fontSize: `${13 * textScale}px`, fontWeight: 600, cursor: 'pointer', transition: 'background-color 0.15s', fontFamily: selectedFont.value }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = ACCENT_H}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = ACCENT}>
              <Crown style={{ width: '14px', height: '14px', color: '#fde68a' }} />Go Premium — ₹299/mo
            </button>
          </aside>
        </div>

        {/* ═══ ARTICLE MODAL ═══════════════════════════════════════════════════════ */}
        <Dialog open={!!selectedNews} onOpenChange={handleCloseArticle}>
          <DialogContent style={{ maxWidth: '720px', maxHeight: '90vh', padding: 0, overflow: 'hidden', borderRadius: '16px', backgroundColor: surface }}>
            {selectedNews && (
              <ScrollArea style={{ maxHeight: '90vh' }} ref={contentRef} onScroll={handleScroll}>
                <div style={{ position: 'relative', aspectRatio: '16/9' }}>
                  <img src={selectedNews.featuredImage || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800'} alt={selectedNews.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  <span style={{ position: 'absolute', top: '16px', left: '16px', backgroundColor: getCatAccent(selectedNews.category), color: 'white', fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: '20px', textTransform: 'capitalize', fontFamily: selectedFont.value }}>{selectedNews.category}</span>
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '3px', backgroundColor: 'rgba(0,0,0,0.15)' }}>
                    <div style={{ height: '100%', backgroundColor: ACCENT, width: `${scrollPosition}%`, transition: 'width 0.3s' }} />
                  </div>
                </div>
                <div style={{ padding: '24px 28px', backgroundColor: surface }}>
                  <h1 style={{ fontSize: `${22 * textScale}px`, fontWeight: 700, lineHeight: 1.35, marginBottom: '16px', color: T1, fontFamily: selectedFont.value }}>{selectedNews.title}</h1>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px', paddingBottom: '16px', borderBottom: `1px solid ${bdr}`, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                      <div style={{ width: '26px', height: '26px', borderRadius: '50%', backgroundColor: ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <User style={{ width: '13px', height: '13px', color: 'white' }} />
                      </div>
                      <span style={{ fontSize: `${13 * textScale}px`, fontWeight: 600, color: T2, fontFamily: selectedFont.value }}>{selectedNews.authorName || 'NewsDesk'}</span>
                    </div>
                    <span style={{ fontSize: `${12 * textScale}px`, color: T3, display: 'flex', alignItems: 'center', gap: '4px', fontFamily: selectedFont.value, fontWeight: 300 }}><Clock style={{ width: '12px', height: '12px' }} />{formatDate(selectedNews.publishedAt)}</span>
                    <span style={{ fontSize: `${12 * textScale}px`, color: T3, display: 'flex', alignItems: 'center', gap: '4px', fontFamily: selectedFont.value, fontWeight: 300 }}><Eye style={{ width: '12px', height: '12px' }} />{selectedNews.views?.toLocaleString() || 0} views</span>
                  </div>
                  {selectedNews.tags?.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px', marginBottom: '18px' }}>
                      {selectedNews.tags.map(tag => <span key={tag} style={{ padding: '3px 10px', borderRadius: '20px', border: `1px solid ${bdr}`, fontSize: `${12 * textScale}px`, color: T3, fontFamily: selectedFont.value }}>#{tag}</span>)}
                    </div>
                  )}
                  <div style={{ marginBottom: '20px' }}><NativeAd /></div>
                  <div style={{ fontSize: `${15 * textScale}px`, lineHeight: 1.85, color: T2, fontFamily: selectedFont.value, fontWeight: 400, whiteSpace: 'pre-wrap' }}>{selectedNews.content}</div>
                  {selectedNews.corrections?.length > 0 && (
                    <div style={{ marginTop: '20px', padding: '14px', backgroundColor: dark ? 'rgba(234,179,8,0.08)' : '#fefce8', border: '1px solid #fde68a', borderRadius: '8px' }}>
                      <p style={{ fontSize: '12px', fontWeight: 700, color: '#92400e', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}><AlertCircle style={{ width: '13px', height: '13px' }} />Corrections</p>
                      {selectedNews.corrections.map(c => <p key={c.id} style={{ fontSize: '12px', color: '#92400e', marginBottom: '4px' }}>{c.text}</p>)}
                    </div>
                  )}
                  <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: `1px solid ${bdr}` }}>
                    <p style={{ fontSize: '11px', fontWeight: 600, color: T3, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '10px', fontFamily: selectedFont.value }}>Share this article</p>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {[{ label: 'WhatsApp', bg: '#25d366', fn: () => shareOnWhatsApp(selectedNews) }, { label: 'Twitter', bg: '#1da1f2', fn: () => shareOnTwitter(selectedNews) }, { label: 'Facebook', bg: '#1877f2', fn: () => shareOnFacebook(selectedNews) }].map(s => (
                        <button key={s.label} onClick={s.fn} style={{ padding: '7px 14px', borderRadius: '8px', border: 'none', backgroundColor: s.bg, color: 'white', fontSize: `${13 * textScale}px`, fontWeight: 600, cursor: 'pointer', fontFamily: selectedFont.value }}>{s.label}</button>
                      ))}
                    </div>
                  </div>
                </div>
              </ScrollArea>
            )}
          </DialogContent>
        </Dialog>

        <SubscriptionPlans open={subscriptionDialogOpen} onClose={() => setSubscriptionDialogOpen(false)} />

        <style jsx global>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Poppins:wght@300;400;500;600;700;800&family=DM+Sans:wght@300;400;500;600;700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=Nunito+Sans:wght@300;400;600;700;800&display=swap');
          * { box-sizing: border-box; margin: 0; padding: 0; }
          @keyframes spin { to { transform: rotate(360deg); } }
          @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }
          @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
          .animate-marquee { display: inline-block; animation: marquee 35s linear infinite; }
          ::-webkit-scrollbar { width: 4px; height: 4px; }
          ::-webkit-scrollbar-track { background: transparent; }
          ::-webkit-scrollbar-thumb { background: #CBD5E0; border-radius: 4px; }
          input[type="search"]::-webkit-search-cancel-button { display: none; }
        `}</style>
      </FontCtx.Provider>
    </DarkCtx.Provider>
  );
}