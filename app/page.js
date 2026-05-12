'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { auth, signInWithGoogle, signInWithApple, logOut } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import Image from "next/image";
import {
  Search, Menu, X, Clock, Eye, ChevronRight, Newspaper,
  Bell, User, Bookmark, Building, Trophy, Briefcase, Film,
  Laptop, MapPin, Flag, Globe, Loader2, AlertCircle,
  ExternalLink, Crown, CheckCircle, Image as ImageIcon,
  ChevronDown, Settings, HelpCircle, LogOut as LogOutIcon,
  Music, Plane, Share2, ArrowUp, ArrowDown, Sun, Moon,
  MessageCircle, Type, ChevronUp, Apple,
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

const translations = {
  en: {
    latestNews: "Latest News",
    local: "Local",
    national: "National",
    world: "World",
    entertainment: "Entertainment",
    politics: "Politics",
    business: "Business",
    sports: "Sports",
    technology: "Technology",
    more: "More",
    news: "News",
    movies: "Movies",
    music: "Music",
    travel: "Travel",
    discussion: "Discussion",
    schemes: "Schemes",
    study: "Study",
    jobs: "Jobs",
    farmer: "Farmer",
    science: "Science",
    leap: "Leap",
    spirituality: "Spirituality",
    localInterest: "Local Interest",
    settings: "Settings",
    language: "Language",
    typography: "Typography",
    lightMode: "Light Mode",
    darkMode: "Dark Mode",
    logout: "Log Out",
    adminPanel: "Admin Panel",
    trendingNews: "Trending News",
    trendingSections: "Trending Sections",
    popularTags: "Popular Tags",
    searchPlaceholder: "Type to search...",
    loadMore: "Load More",
    noArticles: "No articles found",
    checkBackLater: "Check back later"
  },

  hi: {
    latestNews: "ताज़ा खबर",
    local: "स्थानीय",
    national: "राष्ट्रीय",
    world: "दुनिया",
    entertainment: "मनोरंजन",
    politics: "राजनीति",
    business: "व्यापार",
    sports: "खेल",
    technology: "तकनीक",
    more: "और",
    news: "समाचार",
    movies: "फिल्में",
    music: "संगीत",
    travel: "यात्रा",
    discussion: "विमर्श",
    schemes: "योजनाएं",
    study: "पढ़ाई",
    jobs: "नौकरी",
    farmer: "किसान",
    science: "विज्ञान",
    leap: "छलांग",
    spirituality: "आध्यात्म",
    localInterest: "लोकरुचि",
    settings: "सेटिंग्स",
    language: "भाषा",
    typography: "टाइपोग्राफी",
    lightMode: "लाइट मोड",
    darkMode: "डार्क मोड",
    logout: "लॉग आउट",
    adminPanel: "एडमिन पैनल",
    trendingNews: "ट्रेंडिंग न्यूज़",
    trendingSections: "लोकप्रिय सेक्शन",
    popularTags: "लोकप्रिय टैग",
    searchPlaceholder: "खोजें...",
    loadMore: "और देखें",
    noArticles: "कोई लेख नहीं मिला",
    checkBackLater: "बाद में देखें"
  }
};

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

const ProgrammaticAd = ({ placement, size = "728x90" }) => {
  const dark = React.useContext(DarkCtx);

  useEffect(() => {
    // Your existing custom impression tracking
    fetch("/api/ads/impression", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        adId: `prog_${placement}_${Date.now()}`,
        adType: "programmatic",
        placement,
        sessionId: getSessionId(),
        estimatedRevenue: 0.002,
      }),
    }).catch(() => {});

    // Google AdSense initialization
    try {
      if (window.adsbygoogle) {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (err) {
      console.log("Adsense error:", err);
    }
  }, [placement]);

  const [, height] = size.split("x").map(Number);

  return (
    <div
      style={{
        height,
        width: "100%",
        backgroundColor: dark ? "#1e2130" : "#F5F6F8",
        borderRadius: "8px",
        overflow: "hidden",
      }}
    >
      <ins
        className="adsbygoogle"
        style={{
          display: "block",
          width: "100%",
          height: "100%",
        }}
        data-ad-client="ca-pub-1008647598112103"
        data-ad-slot="YOUR_AD_SLOT_ID"
        data-ad-format="auto"
        data-full-width-responsive="true"
      ></ins>
    </div>
  );
};

const NativeAd = () => {
  const dark = React.useContext(DarkCtx);

  useEffect(() => {
    // Track impression in your database
    fetch("/api/ads/impression", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        adId: `native_${Date.now()}`,
        adType: "native",
        placement: "in-article",
        sessionId: getSessionId(),
        estimatedRevenue: 0.005,
      }),
    }).catch(() => {});

    // Load AdSense ad
    try {
      if (window.adsbygoogle) {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (err) {
      console.log("Adsense error:", err);
    }
  }, []);

  return (
    <div
      style={{
        width: "100%",
        minHeight: "250px",
        backgroundColor: dark ? "#1e2130" : "#F5F6F8",
        borderRadius: "10px",
        overflow: "hidden",
      }}
    >
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client="ca-pub-1008647598112103"
        data-ad-slot="YOUR_AD_SLOT_ID"
        data-ad-format="fluid"
        data-ad-layout="in-article"
      ></ins>
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
        {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><Loader style={{ width: '28px', height: '28px', color: ACCENT }} /></div> : (
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
const ArticleCard = ({ item, onClick, formatDate, showShareMenu, setShowShareMenu, selectedLanguage }) => {
  const dark = React.useContext(DarkCtx);
  const shareRef = useRef(null);
  const { scale } = React.useContext(FontCtx);
  const catColor = getCatAccent(item.category);
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={() => onClick(item)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ cursor: 'pointer', backgroundColor: dark ? '#1e2130' : '#FFFFFF', border: `1px solid ${dark ? '#2e3347' : '#E6E8EB'}`, borderRadius: '12px', overflow: 'visible', transition: 'box-shadow 0.2s, transform 0.2s', boxShadow: hovered ? '0 6px 20px rgba(0,0,0,0.09)' : '0 1px 3px rgba(0,0,0,0.04)', transform: hovered && showShareMenu !== item.id ? 'translateY(-2px)' : 'none' }}
    >
      <div style={{ position: 'relative', height: '186px', overflow: 'hidden', zIndex: 1, display: 'flex', backgroundColor: dark ? '#2e3347' : '#F0F2F5' }}>
        <img src={item.featuredImage || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600'} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s', transform: hovered ? 'scale(1.04)' : 'scale(1)' }} />
        {item.isBreaking && (
          <span style={{ position: 'absolute', top: '10px', right: '10px', backgroundColor: '#e53e3e', color: 'white', fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '20px', letterSpacing: '0.04em' }}>BREAKING</span>
        )}
      </div>
      <div style={{ padding: '14px 16px 16px' }}>
        <span style={{ fontSize: `${11 * scale}px`, fontWeight: 600, backgroundColor: getCatAccent(item.category), color: 'white', borderRadius: '20px', padding: '3px 10px', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}> {selectedLanguage === "hi" ? (translations.hi[item.category] || item.category) : item.category}</span>
        <h3 style={{ fontSize: `${15 * scale}px`, fontWeight: 700, color: dark ? '#e2e8f0' : '#2d3748', lineHeight: 1.4, marginBottom: '5px', marginTop: '5px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.title}</h3>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
            
            <span style={{ fontSize: `${11 * scale}px`, fontWeight: 300, color: '#8A8F98', flexShrink: 0, whiteSpace: 'nowrap' }}>{formatDate(item.publishedAt)}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0 }}>
            <button onClick={(e) => e.stopPropagation()} style={{ padding: '5px', border: 'none', background: 'none', cursor: 'pointer', borderRadius: '6px', color: '#8A8F98', transition: 'background 0.15s' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = dark ? '#2e3347' : '#F0F2F5'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
              <Bookmark style={{ width: '14px', height: '14px' }} />
            </button>
            <div ref={shareRef} style={{ position: 'relative' }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowShareMenu(prev => prev === item.id ? null : item.id);
                }}
                style={{
                  padding: '5px',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  borderRadius: '6px',
                  color: '#8A8F98',
                  transition: 'background 0.15s'
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = dark ? '#2e3347' : '#F0F2F5'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <Share2 style={{ width: '13px', height: '13px' }} />
              </button>

              {showShareMenu === item.id && (  
                <div
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    position: 'absolute',
                    top: '110%',   
                    right: 0,
                    background: 'white',
                    border: '1px solid #E6E8EB',
                    borderRadius: '10px',
                    padding: '10px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    zIndex: 9999,
                    minWidth: '140px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.15)'
                  }}
                >
                  <button
                    onClick={() => shareOnWhatsApp(item)}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      padding: '8px 10px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      borderRadius: '6px',
                      fontSize: '13px'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f3f4f6'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    WhatsApp
                  </button>

                  <button
                    onClick={() => shareOnTwitter(item)}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      padding: '8px 10px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      borderRadius: '6px',
                      fontSize: '13px'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f3f4f6'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    Twitter
                  </button>

                  <button
                    onClick={() => shareOnFacebook(item)}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      padding: '8px 10px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      borderRadius: '6px',
                      fontSize: '13px'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f3f4f6'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    Facebook
                  </button>

                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `${window.location.origin}/news/${item.id}`
                      );
                      toast.success("Link copied!");
                    }}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      padding: '8px 10px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      borderRadius: '6px',
                      fontSize: '13px'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f3f4f6'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    Copy Link
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Right sidebar trending item ──────────────────────────────────────────────
const TrendingItem = ({ item, onClick, dark, scale, selectedLanguage }) => (
  <div onClick={() => onClick(item)} style={{ display: 'flex', gap: '10px', padding: '10px 0', cursor: 'pointer', borderBottom: `1px solid ${dark ? '#2e3347' : '#F0F2F5'}` }}
    onMouseEnter={e => e.currentTarget.style.opacity = '0.75'} onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
    <div style={{ width: '52px', height: '52px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, backgroundColor: dark ? '#2e3347' : '#F0F2F5' }}>
      <img src={item.featuredImage || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=200'} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <p style={{ fontSize: `${11 * scale}px`, fontWeight: 600, color: getCatAccent(item.category), textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3px' }}>{selectedLanguage === "hi" ? (translations.hi[item.category] || item.category) : item.category}</p>
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

const Loader = () => {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div className="loader"></div>
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────
export default function HomePage() {
  const [news, setNews] = useState([]);
  const [breakingNews, setBreakingNews] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
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
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);
  const [isChevronVisible, setIsChevronVisible] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [selectedFont, setSelectedFont] = useState(FONT_OPTIONS[0]);
  const [textScale, setTextScale] = useState(1);
  const [showFontToolbar, setShowFontToolbar] = useState(false);
  const contentRef = useRef(null);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const moreMenuRef = useRef(null);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("hi");
  const [languageLoaded, setLanguageLoaded] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileRef = useRef(null);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [windowWidth, setWindowWidth] = useState(1200);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterLoading, setNewsletterLoading] = useState(false);

  const t = translations[selectedLanguage];

  const [showShareMenu, setShowShareMenu] = useState(null);
  const shareMenuRef = useRef(null);

  //=================================Mobile view handling========================================
  // Check initial width on mount and set mobile view accordingly
  useEffect(() => {
    let timeout;
    const handleResize = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        setIsMobileView(window.innerWidth <= 1159);
      }, 150); // debounce
    };
    handleResize(); // run on load
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // User profile
  useEffect(() => {
    function handleClickOutside(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  //Handle mobile search with debounce

  useEffect(() => {
    if (!isMobileView) return;
    const delay = setTimeout(() => {
      if (searchQuery.trim() !== '') {
        fetchNews(selectedCategory, searchQuery, 1);
        // setShowMobileSearch(false);
      }
    }, 400);
    return () => clearTimeout(delay);
  }, [searchQuery, selectedCategory]);

  // Track window width for responsive features

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
//=====================================Desktop only features below========================================

  // persist prefs
  useEffect(() => {
    const savedLanguage = localStorage.getItem("news_language");
    if (savedLanguage) {
      setSelectedLanguage(savedLanguage);
    }else {
      setSelectedLanguage("hi"); // default Hindi
    }
    if (!savedLanguage) {
      localStorage.setItem("news_language", "hi");
    }
    setLanguageLoaded(true);
  }, []);

  useEffect(() => {
    if (languageLoaded) {
      localStorage.setItem("news_language", selectedLanguage);
    }
  }, [selectedLanguage, languageLoaded]);

 // Chevron visibility on sidebar toggle

  useEffect(() => {
    let timer;
    setIsChevronVisible(true);
    timer = setTimeout(() => {
      setIsChevronVisible(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, [isRightSidebarOpen]);

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
  const fetchTags = useCallback(async () => { try { const res = await fetch('/api/tags'); const data = await res.json(); const filtered = (data.tags || []).filter( tag => tag.active && tag.popular ); setTags(filtered); } catch (err) { console.error(err); }
}, []);
  const fetchNews = useCallback(async (cat = 'all', search = '', pageNum = 1) => {
    try {
      setLoading(true);
      let url = `/api/news?page=${pageNum}&limit=20`;
      if (cat && cat !== 'all') url += `&category=${cat}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      const r = await fetch(url); const d = await r.json();
      // console.log("TOTAL ARTICLES FROM API:", d.news?.length);
      if (pageNum === 1) setNews(d.news || []); else setNews(p => [...p, ...(d.news || [])]);
      setHasMore(d.pagination?.page < d.pagination?.pages);
    } catch (e) { console.error(e); toast.error('Failed to load news'); } finally { setLoading(false); }
  }, []);
  const fetchBreakingNews = useCallback(async () => { try { const r = await fetch('/api/news/breaking'); const d = await r.json(); setBreakingNews(d.news || []); } catch (e) { console.error(e); } }, []);
  const fetchYoutubeLive = useCallback(async () => { try { const r = await fetch('/api/youtube/live'); const d = await r.json(); if (d.configured) setYoutubeLive(d); } catch (e) { console.error(e); } }, []);
  const seedData = useCallback(async () => { try { await fetch('/api/seed', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }); } catch (e) { console.error(e); } }, []);

  useEffect(() => { const init = async () => { await seedData(); await fetchCategories(); await fetchTags(); await fetchBreakingNews(); await fetchNews(); fetchYoutubeLive(); }; init(); }, [seedData, fetchCategories, fetchTags, fetchBreakingNews, fetchNews, fetchYoutubeLive]);
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

  {/* More menu*/}
  useEffect(() => {
    function handleClickOutside(event) {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target)) {
        setShowMoreMenu(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

{/* Share*/ }
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        shareMenuRef.current &&
        !shareMenuRef.current.contains(event.target)
      ) {
        setShowShareMenu(null);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  {/* Notification bell handler */ }
  const handleNotificationClick = async () => {
  if (!("Notification" in window)) {
    alert("Notifications not supported");
    return;
  }

  if (Notification.permission === "granted") {
    new Notification("NewsDesk 🔔", {
      body: "You are already subscribed!",
    });
    return;
  }

  const permission = await Notification.requestPermission();

    if (permission === "granted") {
      new Notification("Subscribed ✅", {
        body: "You will receive breaking news alerts!",
      });
    } else {
      alert("Permission denied ❌");
    }
  };

  // Newsletter subscription handler

  const handleNewsletterSubscribe = async () => {
    if (!newsletterEmail.trim()) {
      toast.error(
        selectedLanguage === 'hi'
          ? 'ईमेल दर्ज करें'
          : 'Please enter email'
      );
      return;
    }
    try {
      setNewsletterLoading(true);

      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: newsletterEmail
        })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(
          selectedLanguage === 'hi'
            ? 'सफलतापूर्वक सब्सक्राइब किया गया'
            : 'Subscribed successfully'
        );
        setNewsletterEmail('');
      } else {
        toast.error(data.error || 'Something went wrong');
      }
    } catch (err) {
      toast.error('Server error');
    } finally {
      setNewsletterLoading(false);
    }
  };

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
    { label: t.latestNews, slug: 'all' },
    { label: t.politics, slug: 'politics' },
    { label: t.business, slug: 'business' },
    { label: t.sports, slug: 'sports' },
    { label: t.technology, slug: 'technology' },
  ];

  const mobileNavItems = [
    { label: t.latestNews, slug: 'all' },
    ...categories.map(cat => ({
      label:
        selectedLanguage === "hi"
          ? (translations.hi[cat.slug] || cat.name)
          : cat.name,
      slug: cat.slug
    }))
  ];

  const navSlugs = navItems.map(n => n.slug);

  const isMoreActive =
  selectedCategory !== 'all' &&
  !navItems.some(n => n.slug === selectedCategory);

  const extraCategories = categories.filter(
    cat => !navSlugs.includes(cat.slug)
  );

  const leftNavItems = [
    { label: t.news, icon: Newspaper, slug: 'all' },
    { label: t.movies, icon: Film, slug: 'entertainment' },
    { label: t.music, icon: Music, slug: 'music' },
    { label: t.travel, icon: Plane, slug: 'travel' },
    { label: t.sports, icon: Trophy, slug: 'sports' },
  ];

  const trendingCategories = categories.map((cat, i) => ({
    name: cat.name,
    views: [60250, 45000, 24500, 9850, 5250][i] || 1000,
    trend: [true, false, true, false, true][i],
    icon: getCategoryIcon(cat.slug),
    slug: cat.slug,
  }));

  const allTags = tags;

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
        <div
          style={{
            minHeight: '100vh',
            backgroundColor: bg,

            fontFamily:
              selectedLanguage === 'hi'
                ? "'Noto Sans Devanagari', sans-serif"
                : selectedFont.value,

            display: 'flex'
          }}
        >

          {/* ═══ CENTER CONTENT ════════════════════════════════════════════════ */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, width: '100%', paddingLeft: isMobileView ? '0px' : (sidebarCollapsed ? '60px' : '220px'), paddingRight: isMobileView ? '0px' : (isRightSidebarOpen ? '288px' : '0px'), }}>

            {/* Top nav bar */}
            <header style={{ backgroundColor: surface, borderBottom: `1px solid ${bdr}`, display: 'flex', flexDirection: isMobileView ? 'column' : 'row', alignItems: isMobileView ? 'stretch' : 'center', justifyContent: 'space-between', width: '100%', height: isMobileView ? '102px' : '54px', position: 'fixed', left: 0, top: 0, zIndex: 100 }}> 

              {/* Mobile view */}

              {isMobileView ? (
                <>
                  {/* ================= MOBILE TOP NAVBAR ================= */}
                  <div
                    style={{
                      height: 'auto',
                      minHeight: '56px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0 16px',
                    }}
                  >
                    {/* LEFT: LOGO */}
                    <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginRight: '20px'
                  }}>
                    <Image
                      src="/LOGO1.jpeg"
                      alt="Logo mark"
                      width={36}
                      height={36}
                      style={{ boxShadow: '0 0 10px rgba(255, 255, 255, 0.8)' }}
                    />
                    <Image
                      src="/logo.svg"
                      alt="Logo"
                      width={90}
                      height={36}
                    />
                  </div>

                    {/* RIGHT: ICONS */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      
                      {/* Search */}
                      <Search
                        onClick={() => {setShowMobileSearch(true); setIsSearchActive(true);}}
                        style={{ width: '20px', height: '20px', color: T2, cursor: 'pointer' }}
                      />

                      {/* Dark Mode */}
                      <div style={{ padding: '12px', borderTop: `1px solid ${bdr}`, display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
                        <button onClick={toggleDark} style={{ padding: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer', backgroundColor: 'transparent', color: T3 }} onMouseEnter={e => e.currentTarget.style.backgroundColor = hoverBg} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                          {dark ? <Moon style={{ width: '16px', height: '16px' }} /> : <Sun style={{ width: '16px', height: '16px' }} />}
                        </button>
                      </div>

                      {/* Profile */}
                      <div ref={profileRef} style={{ position: 'relative' }}>
                        <User
                          onClick={() => setShowProfileMenu(p => !p)}
                          style={{
                            width: '20px',
                            height: '20px',
                            color: T2,
                            cursor: 'pointer'
                          }}
                          onMouseEnter={e => e.currentTarget.style.color = ACCENT}
                          onMouseLeave={e => e.currentTarget.style.color = T2}
                        />

                        {showProfileMenu && (
                          <div
                            style={{
                              position: 'absolute',
                              top: '32px',
                              right: 0,
                              width: '200px',
                              backgroundColor: surface,
                              border: `1px solid ${bdr}`,
                              borderRadius: '10px',
                              boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                              padding: '12px',
                              zIndex: 999
                            }}
                          >

                            {/* USER INFO */}
                            {user ? (
                              <div style={{ marginBottom: '10px' }}>
                                <p style={{ fontSize: '13px', fontWeight: 600, color: T1 }}>
                                  {user.displayName || user.email?.split('@')[0]}
                                </p>
                                <p style={{ fontSize: '11px', color: T3 }}>
                                  {user.email}
                                </p>
                              </div>
                            ) : null}

                            {/* SIGN IN */}
                            {!user && (
                              <button
                                onClick={() => {
                                  setAuthDialogOpen(true);
                                  setShowProfileMenu(false);
                                }}
                                style={{
                                  width: '100%',
                                  padding: '10px',
                                  borderRadius: '8px',
                                  border: `1px solid ${bdr}`,
                                  backgroundColor: dark ? 'rgba(59,175,218,0.12)' : '#EBF8FF',
                                  color: ACCENT,
                                  cursor: 'pointer',
                                  fontSize: '13px',
                                  fontWeight: 600,
                                  transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={e => {
                                  e.currentTarget.style.backgroundColor = ACCENT;
                                  e.currentTarget.style.color = '#fff';
                                  e.currentTarget.style.transform = 'scale(1.02)';
                                }}
                                onMouseLeave={e => {
                                  e.currentTarget.style.backgroundColor = dark ? 'rgba(59,175,218,0.12)' : '#EBF8FF';
                                  e.currentTarget.style.color = ACCENT;
                                  e.currentTarget.style.transform = 'scale(1)';
                                }}
                              >
                                Sign In
                              </button>
                            )}

                            {/* LOGOUT BUTTON */}
                            {user && (
                              <button
                                onClick={() => {
                                  handleSignOut();
                                  setShowProfileMenu(false);
                                }}
                                style={{
                                  width: '100%',
                                  marginTop: '10px',
                                  padding: '10px 12px',
                                  borderRadius: '8px',
                                  border: 'none',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '10px',
                                  backgroundColor: dark ? 'rgba(239,68,68,0.12)' : '#FEE2E2',
                                  color: '#EF4444',
                                  fontSize: '13px',
                                  fontWeight: 600,
                                  transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={e => {
                                  e.currentTarget.style.backgroundColor = '#EF4444';
                                  e.currentTarget.style.color = '#fff';
                                  e.currentTarget.style.transform = 'scale(1.02)';
                                }}
                                onMouseLeave={e => {
                                  e.currentTarget.style.backgroundColor = dark ? 'rgba(239,68,68,0.12)' : '#FEE2E2';
                                  e.currentTarget.style.color = '#EF4444';
                                  e.currentTarget.style.transform = 'scale(1)';
                                }}
                              >
                                <LogOutIcon style={{ width: '16px', height: '16px' }} />
                                {t.logout}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ================= CATEGORY NAVBAR ================= */}
                  <div
                    style={{
                      height: 'auto',
                      minHeight: '46px',
                      display: 'flex',
                      alignItems: 'center',
                      overflowX: 'auto',
                      padding: '0 10px',
                      gap: '10px',
                      borderTop: `1px solid ${bdr}`,
                      backgroundColor: dark ? '#181a24' : '#fff',
                      scrollBehavior: 'smooth',
                    }}
                    className="hide-scrollbar"
                  >
                    {mobileNavItems.map((item) => {
                      const isActive = selectedCategory === item.slug;

                      return (
                        <button
                          key={item.slug}
                          onClick={() => setSelectedCategory(item.slug)}
                          style={{
                            whiteSpace: 'nowrap',
                            padding: '6px 14px',
                            borderRadius: '20px',
                            border: 'none',
                            fontSize: '13px',
                            cursor: 'pointer',
                            backgroundColor: isActive
                              ? ACCENT
                              : dark
                              ? '#252838'
                              : '#F1F3F5',
                            color: isActive ? 'white' : T2,
                            transition: 'all 0.2s ease',
                          }}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </>
              ) : (
                <>

                  {/* ============================ Desktop view ======================================= */}
                                    
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginRight: '20px',
                    paddingLeft: '20px',
                  }}>
                    <Image
                      src="/LOGO1.jpeg"
                      alt="Logo mark"
                      width={36}
                      height={36}
                      style={{ boxShadow: '0 0 10px rgba(255, 255, 255, 0.8)' }}
                    />
                    <Image
                      src="/logo.svg"
                      alt="Logo"
                      width={90}
                      height={36}
                    />
                  </div>
                  
                  <nav style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
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

                    {/* "More" dropdown for extra categories */}
                    {extraCategories.length > 0 && (
                      <div ref={moreMenuRef} style={{ position: 'relative' }}>
                        
                        <button
                          onClick={() => setShowMoreMenu(p => !p)}
                          style={{
                            padding: '0 14px',
                            height: '54px',
                            border: 'none',
                            cursor: 'pointer',
                            backgroundColor: 'transparent',
                            fontSize: `${14 * textScale}px`,
                            fontWeight: isMoreActive ? 600 : 500,
                            color: isMoreActive ? ACCENT : T3,
                            borderBottom: isMoreActive
                              ? `2px solid ${ACCENT}`
                              : '2px solid transparent',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.color = ACCENT;
                            e.currentTarget.style.textShadow = '0 0 8px rgba(59,175,218,0.6)';
                          }}
                          onMouseLeave={e => {
                            if (!isMoreActive) {
                              e.currentTarget.style.color = T3;
                              e.currentTarget.style.textShadow = 'none';
                            }
                          }}
                        >
                          {t.more} <ChevronDown style={{ width: '13px', height: '13px' }} />
                        </button>

                        {showMoreMenu && (
                          <div style={{
                            position: 'absolute',
                            top: '54px',
                            left: 0,
                            backgroundColor: surface,
                            border: `1px solid ${bdr}`,
                            borderRadius: '8px',
                            minWidth: '180px',
                            boxShadow: '0 8px 20px rgba(0,0,0,0.08)',
                            zIndex: 100
                          }}>
                            {extraCategories.map(cat => {
                              const isActive = selectedCategory === cat.slug;

                              return (
                                <button
                                  key={cat.slug}
                                  onClick={() => {
                                    setSelectedCategory(cat.slug);
                                    setShowMoreMenu(false);
                                  }}
                                  style={{
                                    width: '100%',
                                    textAlign: 'left',
                                    padding: '10px 14px',
                                    border: 'none',
                                    background: isActive ? (dark ? 'rgba(59,175,218,0.15)' : '#EBF8FF') : 'transparent',
                                    cursor: 'pointer',
                                    color: isActive ? ACCENT : T2,
                                    fontSize: `${13 * textScale}px`,
                                    fontWeight: isActive ? 600 : 500,
                                    transition: 'all 0.15s'
                                  }}
                                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.backgroundColor = hoverBg;}}
                                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';}}
                                >
                                  {
                                    selectedLanguage === "hi"
                                      ? (translations.hi[cat.slug] || cat.name)
                                      : cat.name
                                  }
                                </button>
                              );
                            })}
                          </div>
                        )}

                      </div>
                    )}
                  </nav>

                  {/* Header right */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '16px', flexShrink: 0, minWidth: 0 }}>
                    <button onClick={handleNotificationClick} style={{ width: '32px', height: '32px', borderRadius: '50%', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: surfaceAlt, color: T3, position: 'relative' }}>
                      <Bell style={{ width: '16px', height: '16px' }} />
                      {breakingNews.length > 0 && <span style={{ position: 'absolute', top: '6px', right: '6px', width: '7px', height: '7px', backgroundColor: '#e53e3e', borderRadius: '50%', border: `2px solid ${surface}` }} />}
                    </button>
                    <span></span>
                    <span></span>
                    
                    <form onSubmit={handleSearch}>
                      <div
                        style={{
                          position: 'relative',
                          width: 'clamp(250px, 25vw, 400px)',
                          transition: 'width 0.1s ease'
                        }}
                      >
                        <Search
                          style={{
                            position: 'absolute',
                            left: '9px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            width: '13px',
                            height: '13px',
                            color: T3
                          }}
                        />

                        <input
                          type="search"
                          placeholder={t.searchPlaceholder}
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onFocus={e => e.target.style.borderColor = ACCENT}
                          onBlur={e => e.target.style.borderColor = bdr}
                          style={{
                            backgroundColor: surfaceAlt,
                            border: `1px solid ${bdr}`,
                            borderRadius: '8px',
                            padding: '6px 12px 6px 28px',
                            fontSize: '13px',
                            color: T1,
                            outline: 'none',
                            width: '100%',
                            fontFamily: selectedFont.value,
                            transition: 'border-color 0.15s'
                          }}
                        />
                      </div>
                    </form>
                  </div>
                  <div style={{ height: '24px', marginLeft: '16px', paddingRight: '20px' }} >
                    <span style={{ fontSize: '12px', color: T3, fontFamily: selectedFont.value }}>{new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                </>
              )}
            </header>

            {isMobileView && showMobileSearch && (
              <div
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  backgroundColor: dark ? '#141620' : '#fff',
                  zIndex: 9999,
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '14px'
                }}
              >

                {/* TOP BAR */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>

                  {/* BACK BUTTON */}
                  <button
                    onClick={() => setShowMobileSearch(false)}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: dark ? '#fff' : '#141620',
                      cursor: 'pointer'
                    }}
                  >                    
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                  </button>

                  {/* SEARCH INPUT */}
                  <div style={{ flex: 1, position: 'relative' }}>
                    <input
                      autoFocus
                      placeholder="खबर, टॉपिक, शहर या राज्य खोजें"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          setPage(1);
                          fetchNews(selectedCategory, searchQuery, 1);
                          setIsSearchActive(true);
                        }
                      }}
                      style={{
                        width: '100%',
                        padding: '10px 40px 10px 14px',
                        borderRadius: '10px',
                        border: `1px solid ${bdr}`,
                        backgroundColor: dark ? '#1e2130' : '#f3f4f6',
                        color: T1,
                        fontSize: '14px'
                      }}
                    />

                    <Search
                      onClick={() => {
                        setPage(1);
                        fetchNews(selectedCategory, searchQuery, 1);
                        setIsSearchActive(true);
                      }}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: '18px',
                        height: '18px',
                        color: ACCENT,
                        cursor: 'pointer'
                      }}
                    />
                  </div>
                </div>

                {/* ================= CONTENT ================= */}

                {!isSearchActive ? (
                  // 🔹 BEFORE SEARCH (Trending UI)
                  <div style={{ marginTop: '20px' }}>
                    <p style={{ color: 'red', fontSize: '14px', marginBottom: '12px', fontWeight: 700 }}>
                      ट्रेंडिंग
                    </p>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                      {(allTags.length > 0 ? allTags : [
                        'बंगाल में हिंसा',
                        'अमेरिका-ईरान युद्ध',
                        'IPL 2026',
                        'गर्मी की मार',
                        'चारधाम यात्रा'
                      ]).map(tag => (
                        <button
                          key={tag.id || tagName || index}
                          onClick={() => {
                            setSearchQuery(tag);
                            setIsSearchActive(true);
                            fetchNews(selectedCategory, tag, 1);
                          }}
                          style={{
                            padding: '8px 14px',
                            borderRadius: '20px',
                            border: `1px solid ${bdr}`,
                            background: 'transparent',
                            color: T2,
                            fontSize: '13px',
                            cursor: 'pointer'
                          }}
                        >
                          {typeof tag === 'string' ? tag : tag.name} →
                        </button>
                      ))}
                    </div>
                  </div>

                ) : (
                  // 🔥 AFTER SEARCH (RESULTS LIKE IMAGE 2)
                  <div style={{ marginTop: '16px', overflowY: 'auto' }}>

                    {/* FILTER BUTTONS */}
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
                      <button style={{
                        padding: '6px 14px',
                        borderRadius: '20px',
                        backgroundColor: '#fff',
                        color: '#000',
                        fontSize: '13px',
                        border: 'none',
                        fontWeight: 700
                      }}>
                        लेटेस्ट रिजल्ट
                      </button>

                      <button style={{
                        padding: '6px 14px',
                        borderRadius: '20px',
                        backgroundColor: 'transparent',
                        color: '#aaa',
                        fontSize: '13px',
                        border: `1px solid ${bdr}`,
                        fontWeight: 700
                      }}>
                        टॉप रिजल्ट
                      </button>
                    </div>

                    {/* RESULTS LIST */}
                    {loading ? (
                      <p style={{ textAlign: 'center' }}><Loader /></p>
                    ) : news.length === 0 ? (
                      <p style={{ textAlign: 'center', color: ACCENT, fontWeight: 500 }}>कोई रिजल्ट नहीं मिला</p>
                    ) : (
                      news.map(item => (
                        <div
                          key={item.id}
                          onClick={() => {
                            setShowMobileSearch(false);
                            setSelectedNews(item);
                          }}
                          style={{
                            display: 'flex',
                            gap: '10px',
                            padding: '12px 0',
                            borderBottom: `1px solid ${bdr}`,
                            cursor: 'pointer'
                          }}
                        >
                          <div style={{ flex: 1 }}>
                            <p style={{
                              fontSize: '14px',
                              fontWeight: 600,
                              color: dark ? '#fff' : '#000'
                            }}>
                              {item.title}
                            </p>

                            <p style={{
                              fontSize: '12px',
                              color: T3,
                              marginTop: '6px'
                            }}>
                              {formatDate(item.publishedAt)}
                            </p>
                          </div>

                          <img
                            src={item.featuredImage}
                            style={{
                              width: '90px',
                              height: '60px',
                              borderRadius: '8px',
                              objectFit: 'cover'
                            }}
                          />
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Breaking ticker */}
            {breakingNews.length > 0 && (
              <div style={{ backgroundColor: dark ? '#1a2535' : '#EBF8FF', borderBottom: `1px solid ${dark ? '#2a3d55' : '#BEE3F8'}`, padding: '6px 24px', overflow: 'hidden', display: 'flex', alignItems: 'center', gap: '12px', marginTop: isMobileView ? '102px' : '54px' }}>
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
            <div style={{ flex: 1, padding: isMobileView ? '12px' : '24px', width: '100%', overflowY: 'auto' }}>

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
              {!isMobileView && news.length > 0 && !loading && (() => {
                const hero = news[0];
                return (
                  <div onClick={() => setSelectedNews(hero)}
                    style={{ position: 'relative', borderRadius: '14px', overflow: 'visible', marginBottom: '28px', cursor: 'pointer', height: '320px', border: `1px solid ${bdr}` }}>
                    <img src={hero.featuredImage || 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200'} alt={hero.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.72) 45%, rgba(0,0,0,0.08) 100%)' }} />
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '22px 24px' }}>
                      <span style={{ fontSize: `${11 * textScale}px`, fontWeight: 600, color: 'white', backgroundColor: getCatAccent(hero.category), padding: '3px 10px', borderRadius: '20px', textTransform: 'capitalize', letterSpacing: '0.04em', fontFamily: selectedFont.value }}>{selectedLanguage === "hi" ? (translations.hi[hero.category] || hero.category) : hero.category}</span>
                      <h1 style={{ color: 'white', fontSize: `${20 * textScale}px`, fontWeight: 700, lineHeight: 1.35, margin: '10px 0 12px', fontFamily: selectedFont.value }}>{hero.title}</h1>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {/* <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <User style={{ width: '11px', height: '11px', color: 'white' }} />
                          </div> */}
                          {/* <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: `${12 * textScale}px`, fontFamily: selectedFont.value, fontWeight: 400 }}>{hero.authorName || 'NewsDesk'}</span>
                          <span style={{ color: 'rgba(255,255,255,0.4)' }}>·</span> */}
                          <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: `${11 * textScale}px`, fontFamily: selectedFont.value, fontWeight: 300 }}>{formatDate(hero.publishedAt)}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {[Bookmark].map((Icon, i) => (
                            <button key={i} onClick={(e) => e.stopPropagation()} style={{ background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: '6px', padding: '6px 8px', cursor: 'pointer', color: 'white', backdropFilter: 'blur(4px)' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = dark ? '#2e3347' : '#7c7c7c'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                              <Icon style={{ width: '13px', height: '13px' }} />
                            </button>
                          ))}
                          <div ref={shareMenuRef} style={{ position: 'relative' }}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowShareMenu(prev => prev === hero.id ? null : hero.id);
                              }}
                              style={{
                                background: 'rgba(255,255,255,0.12)',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '6px 8px',
                                cursor: 'pointer',
                                color: 'white',
                                backdropFilter: 'blur(4px)'
                              }}
                              onMouseEnter={e => e.currentTarget.style.backgroundColor = dark ? '#2e3347' : '#7c7c7c'}
                              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                              <Share2 style={{ width: '13px', height: '13px' }} />
                            </button>

                            {showShareMenu === hero.id && (  
                              <div
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                  position: 'absolute',
                                  top: '110%',   
                                  right: 0,
                                  background: 'white',
                                  border: '1px solid #E6E8EB',
                                  borderRadius: '10px',
                                  padding: '10px',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '8px',
                                  zIndex: 100,
                                  minWidth: '140px',
                                  boxShadow: '0 10px 25px rgba(0,0,0,0.15)'
                                }}
                              >
                                <button
                                  onClick={() => shareOnWhatsApp(hero)}
                                  style={{
                                    border: 'none',
                                    background: 'transparent',
                                    padding: '8px 10px',
                                    textAlign: 'center',
                                    cursor: 'pointer',
                                    borderRadius: '6px',
                                    fontSize: '13px'
                                  }}
                                  onMouseEnter={e => e.currentTarget.style.background = '#f3f4f6'}
                                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                >
                                  WhatsApp
                                </button>

                                <button
                                  onClick={() => shareOnTwitter(hero)}
                                  style={{
                                    border: 'none',
                                    background: 'transparent',
                                    padding: '8px 10px',
                                    textAlign: 'center',
                                    cursor: 'pointer',
                                    borderRadius: '6px',
                                    fontSize: '13px'
                                  }}
                                  onMouseEnter={e => e.currentTarget.style.background = '#f3f4f6'}
                                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                >
                                  Twitter
                                </button>

                                <button
                                  onClick={() => shareOnFacebook(hero)}
                                  style={{
                                    border: 'none',
                                    background: 'transparent',
                                    padding: '8px 10px',
                                    textAlign: 'center',
                                    cursor: 'pointer',
                                    borderRadius: '6px',
                                    fontSize: '13px'
                                  }}
                                  onMouseEnter={e => e.currentTarget.style.background = '#f3f4f6'}
                                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                >
                                  Facebook
                                </button>

                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(
                                      `${window.location.origin}/news/${hero.id}`
                                    );
                                    toast.success("Link copied!");
                                  }}
                                  style={{
                                    border: 'none',
                                    background: 'transparent',
                                    padding: '8px 10px',
                                    textAlign: 'center',
                                    cursor: 'pointer',
                                    borderRadius: '6px',
                                    fontSize: '13px'
                                  }}
                                  onMouseEnter={e => e.currentTarget.style.background = '#f3f4f6'}
                                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                >
                                  Copy Link
                                </button>
                              </div>
                            )}
                          </div>
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
                    <Loader style={{ width: '28px', height: '28px', color: ACCENT, margin: '0 auto 10px' }} />
                    <p style={{ color: T3, fontSize: `${14 * textScale}px` }}>Loading articles...</p>
                  </div>
                </div>
              ) : (
                <>
                  {isMobileView ? (
                    //  MOBILE VIEW 
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      {news.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => setSelectedNews(item)}
                          style={{
                            display: 'flex',
                            gap: '14px',
                            padding: isMobileView ? '16px' : '24px',
                            marginBottom: '16px',
                            borderRadius: '22px',
                            cursor: 'pointer',
                            alignItems: 'flex-start',
                            background: dark
                              ? 'linear-gradient(145deg,#1d2233,#151926)'
                              : 'linear-gradient(145deg,#ffffff,#f7f7f8)',
                            border: dark
                              ? '1px solid rgba(255,255,255,0.05)'
                              : '1px solid rgba(0,0,0,0.05)',
                            boxShadow: dark
                              ? '0 10px 25px rgba(0,0,0,0.35)'
                              : '0 8px 24px rgba(0,0,0,0.08)',
                            transition: 'all 0.25s ease',
                            position: 'relative',
                            overflow: 'hidden'
                          }}
                          onTouchStart={(e) => {
                            e.currentTarget.style.transform = 'scale(0.98)';
                          }}
                          onTouchEnd={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                          }}
                        >
                          
                          {/* LEFT CONTENT */}
                          <div style={{ flex: 1, minWidth: 0 }}>

                            {/* CATEGORY */}
                            <div
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                background: dark
                                  ? 'rgba(59,175,218,0.15)'
                                  : 'rgba(59,175,218,0.10)',
                                color: ACCENT,
                                fontSize: '12px',
                                fontWeight: 700,
                                padding: '4px 8px',
                                borderRadius: '30px',
                                marginBottom: '10px',
                                letterSpacing: '0.5px',
                                textTransform: 'uppercase'
                              }}
                            >
                              ● {selectedLanguage === "hi"
                                ? (translations.hi[item.category] || item.category)
                                : item.category}
                            </div>

                            {/* TITLE */}
                            <p
                              style={{
                                fontSize:
                                  window.innerWidth <= 500
                                  ? '13px'
                                  : window.innerWidth <= 700
                                  ? '15px'
                                  : window.innerWidth <= 1159
                                  ? '20px'
                                  : '22px',
                                fontWeight: 800,
                                color: dark ? '#fff' : '#111',
                                lineHeight:
                                  window.innerWidth <= 600
                                    ? 1.45
                                    : 1.35,
                                marginBottom: '10px',
                                display: '-webkit-box',
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                letterSpacing: '-0.3px',
                                maxWidth: '90%'
                              }}
                            >
                              {item.title}
                            </p>
                            <p
                              style={{
                                fontSize: isMobileView ? '11px' : '15px',
                                color: T2,
                                lineHeight: 1.6,
                                marginBottom: '14px',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                opacity: 0.9
                              }}
                            >
                              {item.excerpt || item.summary || item.description}
                            </p>

                            {/* META */}
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                flexWrap: 'wrap'
                              }}
                            >
                              <span
                                style={{
                                  fontSize: '14px',
                                  color: T3,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                🕒 {formatDate(item.publishedAt)}
                              </span>

                              {item.views && (
                                <span
                                  style={{
                                    fontSize: '11px',
                                    color: T3
                                  }}
                                >
                                  👁 {item.views}
                                </span>
                              )}

                              {item.isBreaking && (
                                <span
                                  style={{
                                    background: '#ef4444',
                                    color: '#fff',
                                    fontSize: '10px',
                                    fontWeight: 700,
                                    padding: '4px 8px',
                                    borderRadius: '20px',
                                    animation: 'pulse 1.2s infinite'
                                  }}
                                >
                                  BREAKING
                                </span>
                              )}
                            </div>
                          </div>

                          {/* IMAGE */}
                          <div
                            style={{
                              position: 'relative',
                              flexShrink: 0
                            }}
                          >
                            <img
                              src={
                                item.featuredImage ||
                                'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=300'
                              }
                              style={{
                                width: isMobileView ? '130px' : '220px',
                                height: isMobileView ? '130px' : '160px',
                                borderRadius: '22px',
                                objectFit: 'cover',
                                boxShadow: dark
                                  ? '0 8px 20px rgba(0,0,0,0.4)'
                                  : '0 8px 20px rgba(0,0,0,0.12)'
                              }}
                            />

                            {/* IMAGE OVERLAY */}
                            <div
                              style={{
                                position: 'absolute',
                                inset: 0,
                                borderRadius: '16px',
                                background:
                                  'linear-gradient(to top, rgba(0,0,0,0.15), transparent)'
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    //  DESKTOP VIEW 
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
                      {news.slice(1).map((item, idx) => (
                        <React.Fragment key={item.id}>
                          <ArticleCard
                            item={item}
                            onClick={setSelectedNews}
                            formatDate={formatDate}
                            showShareMenu={showShareMenu}
                            setShowShareMenu={setShowShareMenu}
                            selectedLanguage={selectedLanguage}
                          />
                        </React.Fragment>
                      ))}
                    </div>
                  )}
                  {hasMore && (
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '28px' }}>
                      <button onClick={loadMore} disabled={loading}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 22px', borderRadius: '8px', border: `1px solid ${bdr}`, backgroundColor: surface, color: T2, fontSize: `${13 * textScale}px`, fontWeight: 500, cursor: 'pointer', fontFamily: selectedFont.value, transition: 'border-color 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = ACCENT}
                        onMouseLeave={e => e.currentTarget.style.borderColor = bdr}>
                        {loading ? <Loader style={{ width: '14px', height: '14px', color: ACCENT }} /> : <><span>{t.loadMore}</span><ChevronDown style={{ width: '14px', height: '14px' }} /></>}
                      </button>
                    </div>
                  )}
                  {news.length === 0 && !loading && (
                    <div style={{ textAlign: 'center', padding: '60px 0' }}>
                      <Newspaper style={{ width: '44px', height: '44px', color: T3, margin: '0 auto 12px' }} />
                      <p style={{ color: T1, fontSize: `${15 * textScale}px`, fontWeight: 600, marginBottom: '4px' }}>{t.noArticles}</p>
                      <p style={{ color: T3, fontSize: `${13 * textScale}px` }}>{searchQuery ? 'Try different search terms' : '{t.checkBackLater}'}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* ═══ LEFT SIDEBAR ══════════════════════════════════════════════════ */}
          <aside style={{
            display: isMobileView ? 'none' : 'flex',
            width: sidebarCollapsed ? '60px' : '220px',
            minWidth: sidebarCollapsed ? '60px' : '220px',
            backgroundColor: surface,
            borderRight: `1px solid ${bdr}`,
            flexDirection: 'column',
            marginTop: '54px',
            position: 'fixed', left: 0, top: 0, height: '100vh',
            transition: 'width 0.22s ease, min-width 0.22s ease',
            zIndex: 40, overflowY: 'auto', overflowX: 'hidden',
          }}>

            {/* ── Hamburger row FIXED ── */}
            <div style={{
              padding: '8px 0',
            }}>

              {/* Hamburger ONLY in expanded */}
              {!sidebarCollapsed && (
                <button
                  onClick={() => setSidebarCollapsed(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    display: 'flex',
                    cursor: 'pointer',
                    padding: '8px 21px',
                    borderRadius: '6px',
                    color: T3,
                    gap: '8px',
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = T2}
                  onMouseLeave={e => e.currentTarget.style.color = T3}
                >
                  <Menu style={{ width: '20px', height: '20px' }} />
                  <span>  </span> 
                  <span style={{ fontSize: '15px', fontWeight: 500 }}>
                    Menu
                  </span>
                </button>
              )}
            

              {/* ── Collapsed layout (Logo → Hamburger BELOW) ── */}
              {sidebarCollapsed && (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '8px 21px'
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
                    <Menu style={{ width: '20px', height: '20px' }} />
                  </button>
                </div>
              )}
            </div>

            {/* User profile */}
            <div style={{ padding: '8px 14px', borderBottom: `1px solid ${bdr}`, flexShrink: 0 }}>
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
                      {!sidebarCollapsed && <span style={{ fontSize: '14px', fontWeight: 600, color: T2 }}>Sign In</span>}
                    </button>
                  </DialogTrigger>
                  <DialogContent
                    style={{
                      borderRadius: '20px',
                      padding: '0',
                      overflow: 'hidden',
                      background: 'rgba(255,255,255,0.85)',
                      backdropFilter: 'blur(20px)',
                      border: `1px solid ${bdr}`,
                      boxShadow: '0 20px 60px rgba(0,0,0,0.25)'
                    }}
                  >
                    {/* HEADER */}
                    <div
                      style={{
                        padding: '28px',
                        background: 'linear-gradient(135deg, #3BAFDA, #6C63FF)',
                        color: 'white',
                        textAlign: 'center',
                        position: 'relative'
                      }}
                    >
                      <button
                        onClick={() => setAuthDialogOpen(false)}
                        style={{
                          position: 'absolute',
                          right: '10px',
                          top: '10px',
                          background: 'rgb(255, 255, 255)',
                          border: 'none',
                          borderRadius: '25%',
                          width: '28px',
                          height: '28px',
                          cursor: 'pointer',
                          color: 'White'
                        }}
                      >
                        ✕
                      </button>

                      <h2 style={{ fontSize: '20px', fontWeight: 700 }}>
                        Welcome Back 👋
                      </h2>
                      <p style={{ fontSize: '13px', opacity: 0.9 }}>
                        Sign in to continue to NewsDesk
                      </p>
                    </div>

                    {/* BODY */}
                    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      
                      {/* GOOGLE BUTTON */}
                      <button
                        onClick={handleGoogleSignIn}
                        disabled={authLoading}
                        style={{
                          padding: '12px',
                          borderRadius: '10px',
                          border: `1px solid ${bdr}`,
                          background: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '10px',
                          fontSize: '14px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.15)';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        {authLoading ? (
                          <div className="loader" style={{ width: '18px' }}></div>
                        ) : (
                          <>
                            <img src="https://www.svgrepo.com/show/475656/google-color.svg" width="18" />
                            Continue with Google
                          </>
                        )}
                      </button>

                      {/* APPLE BUTTON */}
                      <button
                        onClick={handleAppleSignIn}
                        disabled={authLoading}
                        style={{
                          padding: '12px',
                          borderRadius: '10px',
                          border: `1px solid ${bdr}`,
                          background: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '10px',
                          fontSize: '14px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.15)';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        <Apple size={16} />
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

              {/* SETTINGS DROPDOWN */}
              <div>
                <button
                  onClick={() => {
                    if (sidebarCollapsed) {
                      setSidebarCollapsed(false);   // 👈 open sidebar first
                    } else {
                      setShowSettingsMenu(p => !p); // 👈 then toggle dropdown
                    }
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: '14.8px',
                    gap: '10px',
                    width: '100%',
                    padding: '9px 10px',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: 'transparent',
                    color: T3,
                    justifyContent: sidebarCollapsed ? 'center' : 'space-between'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Settings style={{ width: '17px', height: '17px' }} />
                    {!sidebarCollapsed && <span>{t.settings}</span>}
                  </div>

                  {!sidebarCollapsed &&
                    (showSettingsMenu ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                </button>

                {showSettingsMenu && !sidebarCollapsed && (
                  <div style={{
                    marginLeft: '28px',
                    marginTop: '6px',
                    backgroundColor: surface,
                    borderRadius: '8px',
                    padding: '10px',
                    border: `1px solid ${bdr}`,
                    zIndex: 50,
                    position: 'relative'
                  }}>

                    {/* Language */}
                    <div style={{ marginBottom: '15px' }}>
                      <p style={{ fontSize: '11px', color: T3 }}>{t.language}</p>

                      <select
                        value={selectedLanguage}
                        onChange={(e) => setSelectedLanguage(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '6px',
                          borderRadius: '6px',
                          border: `1px solid ${bdr}`,
                          background: surface,
                          color: T2,
                          fontSize: '12px'
                        }}
                      >
                        <option value="en">English</option>
                        <option value="hi">Hindi</option>
                      </select>
                    </div>

                    {/* Typography */}
                    <button onClick={() => setShowFontToolbar(p => !p)}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px',width: '100%', borderRadius: '8px', border: 'none', borderTop: `1px solid ${bdr}`, backgroundColor: 'transparent', cursor: 'pointer', color: T3, transition: 'background-color 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = hoverBg}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Type style={{ width: '16px', height: '16px' }} />
                        <span style={{ fontSize: '13px', fontWeight: 600, color: T2 }}>{t.typography}</span>
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

                    {/* Logout (only when user is logged in) */}
                    {user && (
                      <button
                        onClick={handleSignOut}
                        style={{
                          width: '100%',
                          marginTop: '10px',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          backgroundColor: dark ? 'rgba(239,68,68,0.12)' : '#FEE2E2',
                          color: '#EF4444',
                          fontSize: '13px',
                          fontWeight: 600,
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.backgroundColor = '#EF4444';
                          e.currentTarget.style.color = '#fff';
                          e.currentTarget.style.transform = 'scale(1.02)';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.backgroundColor = dark ? 'rgba(239,68,68,0.12)' : '#FEE2E2';
                          e.currentTarget.style.color = '#EF4444';
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                      >
                        <LogOutIcon style={{ width: '16px', height: '16px' }} />
                        {t.logout}
                      </button>
                    )}

                  </div>
                )}
              </div>

              {/* Admin */}
              <button onClick={() => window.location.href = '/admin'}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '9px 10px', borderRadius: '8px', border: 'none', cursor: 'pointer', backgroundColor: 'transparent', color: T3, transition: 'all 0.15s', justifyContent: sidebarCollapsed ? 'center' : 'flex-start' }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = hoverBg; e.currentTarget.style.color = T2; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = T3; }}>
                <Building style={{ width: '17px', height: '17px', flexShrink: 0 }} />
                {!sidebarCollapsed && <><span style={{ fontSize: '14px', fontWeight: 500, flex: 1, textAlign: 'left' }}>{t.adminPanel}</span><ExternalLink style={{ width: '12px', height: '12px', opacity: 0.5 }} /></>}
              </button>

              {/* ── Font Toolbar (above dark mode toggle) ── */}
              {!sidebarCollapsed && (
                <>
                  
                  {/* Dark mode toggle */}
                  <div style={{ padding: '12px 16px', borderTop: `1px solid ${bdr}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {dark ? <Moon style={{ width: '14px', height: '14px', color: T3 }} /> : <Sun style={{ width: '14px', height: '14px', color: T3 }} />}
                      <span style={{ fontSize: '13px', fontWeight: 500, color: T2 }}>
                        {dark 
                          ? (selectedLanguage === "hi" ? "डार्क मोड" : "Dark Mode") 
                          : (selectedLanguage === "hi" ? "लाइट मोड" : "Light Mode")}
                      </span>
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
            </nav>

            
          </aside>

          {/* ═══ RIGHT SIDEBAR ════════════════════════════════════════════════ */}
          <aside
            style={{
              display: isMobileView ? 'none' : 'flex',
              width: isRightSidebarOpen ? '288px' : '0px',
              minWidth: isRightSidebarOpen ? '288px' : '0px',
              marginTop: '54px',
              backgroundColor: surface,
              borderLeft: isRightSidebarOpen ? `1px solid ${bdr}` : 'none',
              padding: isRightSidebarOpen ? '20px 18px' : '0px',
              flexDirection: 'column',
              gap: '22px',
              position: 'fixed',
              right: 0,
              top: 0,
              height: 'calc(100vh - 54px)', // accounts for header
              overflowY: 'auto',
              overflowX: 'hidden',
              transition: 'all 0.3s ease',
              zIndex: 50
            }}
          >

          <button
            onClick={() => setIsRightSidebarOpen(prev => !prev)}
            onMouseEnter={() => setIsChevronVisible(true)}
            onMouseLeave={() => {
              if (!isRightSidebarOpen) {
                setTimeout(() => setIsChevronVisible(false), 1000);
              }
            }}
            style={{
              position: 'fixed',
              right: isRightSidebarOpen ? '288px' : '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 100,
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              backgroundColor: dark ? '#2f2f2f' : '#ffffff',
              border: dark ? 'none' : '1px solid #E6E8EB', 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
              transition: 'all 0.3s ease',
              opacity: isChevronVisible ? 1 : 0.15
            }}
          >
            <ChevronRight
              size={20}
              color={ACCENT}
              style={{
                transform: isRightSidebarOpen ? 'rotate(0deg)' : 'rotate(180deg)',
                transition: 'transform 0.3s ease'
              }}
            />
          </button>

            {/* Trending News */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <h3 style={{ fontSize: `${15 * textScale}px`, fontWeight: 700, color: T1, fontFamily: selectedFont.value }}>{t.trendingNews}</h3>
                {/* <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: ACCENT, padding: '4px', borderRadius: '4px' }}>
                  <ChevronRight style={{ width: '16px', height: '16px' }} />
                </button> */}
              </div>
              <div>
                {(breakingNews.length > 0 ? breakingNews : news).slice(0, 6).map((item) => (
                  <TrendingItem key={item.id} item={item} onClick={setSelectedNews} dark={dark} scale={textScale} selectedLanguage={selectedLanguage} />
                ))}
              </div>
            </div>

            <div style={{ height: '1px', backgroundColor: bdr }} />

            {/* Trending Sections */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <h3 style={{ fontSize: `${15 * textScale}px`, fontWeight: 700, color: T1, fontFamily: selectedFont.value }}>{t.trendingSections}</h3>
                {/* <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: ACCENT, padding: '4px' }}><ChevronRight style={{ width: '16px', height: '16px' }} /></button> */}
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
                      <span style={{ flex: 1, fontSize: `${14 * textScale}px`, fontWeight: 500, color: T2, textAlign: 'left', fontFamily: selectedFont.value }}>{selectedLanguage === "hi" ? (translations.hi[cat.slug] || cat.name) : cat.name}</span>
                      <span style={{ fontSize: `${13 * textScale}px`, color: T3, fontWeight: 300 }}>{(cat.views / 1000).toFixed(cat.views > 10000 ? 0 : 1)}k</span>
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
                <h3 style={{ fontSize: `${15 * textScale}px`, fontWeight: 700, color: T1, fontFamily: selectedFont.value }}>{t.popularTags}</h3>
                {/* <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: T3, fontSize: '18px', lineHeight: 1, padding: '2px' }}>+</button> */}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
                {(allTags.length > 0 ? allTags : selectedLanguage === "hi"? [ 'राजनीति', 'विज्ञापन', 'विकास', 'डिजाइन', 'वित्त', 'फुटबॉल', 'भविष्य', 'यात्रा', 'तकनीक', 'भोजन', 'वास्तुकला', 'टेनिस', 'वीडियो', 'एआई', 'नवाचार', 'खेल', 'स्थानीय', 'चैंपियनशिप', 'नीति', 'अर्थव्यवस्था', 'व्यापार', 'शेयर', 'बाजार', 'सिनेमा', 'मनोरंजन', 'फिल्में' ] : [ 'politics', 'advertising', 'development', 'design', 'finance', 'football', 'future', 'travel', 'technology', 'food', 'architecture', 'tennis', 'video', 'AI', 'innovation', 'sports', 'local', 'championship', 'policy', 'economy', 'business', 'stocks', 'markets', 'cinema', 'entertainment', 'movies' ]).map((tag, index) => {
                  const tagName =
                    typeof tag === 'string'
                      ? tag
                      : tag.name;
                  const tagColor =
                    typeof tag === 'string'
                      ? ACCENT
                      : (tag.color || ACCENT);
                  return (
                    <button
                      key={tag.id || tagName || index}
                      onClick={() => {
                        setSearchQuery(tagName);
                        fetchNews(selectedCategory, tagName, 1);
                      }}
                      style={{
                        padding: '4px 11px',
                        borderRadius: '20px',
                        border: `1px solid ${tagColor}`,
                        backgroundColor: dark
                          ? 'rgba(59,175,218,0.08)'
                          : '#EBF8FF',
                        color: tagColor,
                        fontSize: `${12 * textScale}px`,
                        fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        fontFamily: selectedFont.value
                      }}
                    >
                      #{tagName}
                    </button>
                  );
                })}
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
          <DialogContent
            style={{
              width: isMobileView ? '100vw' : '720px',
              maxWidth: '100vw',
              height: isMobileView ? '100dvh' : '91vh',
              maxHeight: '100dvh',
              padding: 0,
              overflow: 'fixed',
              zIndex: 900,
              border: '5px solid #e7fafe',
              borderRadius: isMobileView ? '0px' : '25px',
              backgroundColor: surface,
              marginTop: isMobileView ? '0px' : '25px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.35)'
            }}
          > 
            {selectedNews && (
              <div
                ref={contentRef}
                onScroll={handleScroll}
                style={{
                  height: '100%',
                  overflowY: 'auto',
                  overflowX: 'hidden',
                  borderRadius: isMobileView ? '0px' : '25px',
                  WebkitOverflowScrolling: 'touch',
                  backgroundColor: surface
                }}
              >

                {/* IMAGE SECTION */}
                <div
                  style={{
                    position: 'relative',
                    width: '100%',
                    height: isMobileView ? 'auto' : 'auto'
                  }}
                >
                  <img
                    src={
                      selectedNews.featuredImage ||
                      'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800'
                    }
                    alt={selectedNews.title}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block'
                    }}
                  />

                  {/* CATEGORY */}
                  <span
                    style={{
                      position: 'absolute',
                      top: '14px',
                      left: '14px',
                      backgroundColor: getCatAccent(selectedNews.category),
                      color: 'white',
                      fontSize: isMobileView ? '10px' : '11px',
                      fontWeight: 600,
                      padding: '4px 10px',
                      borderRadius: '20px',
                      textTransform: 'capitalize',
                      fontFamily: selectedFont.value
                    }}
                  >
                    {selectedLanguage === 'hi'
                      ? translations.hi[selectedNews.category] ||
                        selectedNews.category
                      : selectedNews.category}
                  </span>

                  {/* SCROLL PROGRESS */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: '3px',
                      backgroundColor: 'rgba(0,0,0,0.15)'
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        backgroundColor: ACCENT,
                        width: `${scrollPosition}%`,
                        transition: 'width 0.3s'
                      }}
                    />
                  </div>
                </div>

                {/* CONTENT */}
                <div
                  style={{
                    padding: isMobileView ? '16px' : '24px 28px',
                    backgroundColor: surface
                  }}
                >

                  {/* TITLE */}
                  <h1
                    style={{
                      fontSize: isMobileView
                        ? `${20 * textScale}px`
                        : `${22 * textScale}px`,
                      fontWeight: 700,
                      lineHeight: 1.4,
                      marginBottom: '16px',
                      color: T1,
                      fontFamily: selectedFont.value
                    }}
                  >
                    {selectedNews.title}
                  </h1>

                  {/* META */}
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      gap: '12px',
                      marginBottom: '18px',
                      paddingBottom: '16px',
                      borderBottom: `1px solid ${bdr}`
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '7px'
                      }}
                    >
                      <div
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          backgroundColor: ACCENT,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <User
                          style={{
                            width: '13px',
                            height: '13px',
                            color: 'white'
                          }}
                        />
                      </div>

                      <span
                        style={{
                          fontSize: `${13 * textScale}px`,
                          fontWeight: 600,
                          color: T2,
                          fontFamily: selectedFont.value
                        }}
                      >
                        {selectedNews.authorName || 'NewsDesk'}
                      </span>
                    </div>

                    <span
                      style={{
                        fontSize: `${12 * textScale}px`,
                        color: T3,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Clock style={{ width: '12px', height: '12px' }} />
                      {formatDate(selectedNews.publishedAt)}
                    </span>

                    <span
                      style={{
                        fontSize: `${12 * textScale}px`,
                        color: T3,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Eye style={{ width: '12px', height: '12px' }} />
                      {selectedNews.views?.toLocaleString() || 0} views
                    </span>
                  </div>

                  {/* TAGS */}
                  {selectedNews.tags?.length > 0 && (
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '7px',
                        marginBottom: '18px'
                      }}
                    >
                      {selectedNews.tags.map(tag => {
                        const tagName = typeof tag === 'string' ? tag : tag.name || '';

                        return (
                          <span
                            key={tag.id || tagName}
                            style={{
                              padding: '4px 10px',
                              borderRadius: '20px',
                              border: `1px solid ${bdr}`,
                              fontSize: `${12 * textScale}px`,
                              color: T3,
                              fontFamily: selectedFont.value
                            }}
                          >
                            #{tagName}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* AD */}
                  <div style={{ marginBottom: '20px' }}>
                    <NativeAd />
                  </div>

                  {/* CONTENT */}
                  <div
                    style={{
                      fontSize: isMobileView
                        ? `${16 * textScale}px`
                        : `${15 * textScale}px`,
                      lineHeight: 1.9,
                      color: T2,
                      fontFamily: selectedFont.value,
                      fontWeight: 400,
                      wordBreak: 'break-word'
                    }}
                    dangerouslySetInnerHTML={{
                      __html: selectedNews.content
                    }}
                  />

                  {/* SHARE */}
                  <div
                    style={{
                      marginTop: '20px',
                      paddingTop: '16px',
                      borderTop: `1px solid ${bdr}`
                    }}
                  >
                    <p
                      style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.07em',
                        color: T3,
                        marginBottom: '10px',
                        fontFamily: selectedFont.value
                      }}
                    >
                      Share this article
                    </p>

                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '8px'
                      }}
                    >
                      {[
                        {
                          label: 'WhatsApp',
                          bg: '#25d366',
                          fn: () => shareOnWhatsApp(selectedNews)
                        },
                        {
                          label: 'Twitter',
                          bg: '#1da1f2',
                          fn: () => shareOnTwitter(selectedNews)
                        },
                        {
                          label: 'Facebook',
                          bg: '#1877f2',
                          fn: () => shareOnFacebook(selectedNews)
                        }
                      ].map(s => (
                        <button
                          key={s.label}
                          onClick={s.fn}
                          style={{
                            flex: isMobileView ? '1' : 'unset',
                            minWidth: '110px',
                            padding: '10px 14px',
                            borderRadius: '10px',
                            border: 'none',
                            backgroundColor: s.bg,
                            color: 'white',
                            fontSize: `${13 * textScale}px`,
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>

                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <SubscriptionPlans open={subscriptionDialogOpen} onClose={() => setSubscriptionDialogOpen(false)} />

        <style jsx global>{`
          @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600;700;800&family=Poppins:wght@300;400;500;600;700;800&family=DM+Sans:wght@300;400;500;600;700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=Nunito+Sans:wght@300;400;600;700;800&display=swap');
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
      {/* ═══ RESPONSIVE TABLET / MOBILE FOOTER ═════════════════════ */}
      {windowWidth < 1160 && (
      <footer
        style={{
          backgroundColor: dark ? '#111827' : '#ffffff',
          borderTop: `1px solid ${bdr}`,
          padding:
            windowWidth <= 725
              ? '28px 14px 14px'
              : '40px 24px 18px',
          overflowX: 'hidden',
          width: '100%',
          boxSizing: 'border-box'
        }}
      >
        {/* MAIN */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              windowWidth <= 725
                ? '1fr'
                : windowWidth <= 900
                ? '1fr'
                : '1.2fr 0.9fr',
            gap: windowWidth <= 725 ? '24px' : '30px',
            width: '100%',
            overflow: 'hidden'
          }}
        >

          {/* LEFT SIDE */}
          <div>

            {/* CATEGORIES */}
            <div>
              <h3
                style={{
                  fontSize: '16px',
                  fontWeight: 700,
                  color: T1,
                  marginBottom: '14px'
                }}
              >
                {selectedLanguage === "hi"
                  ? "कैटेगरी"
                  : "Categories"}
              </h3>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '10px 20px'
                }}
              >
                {categories.map((cat) => (
                  <button
                    key={cat.slug}
                    onClick={() => setSelectedCategory(cat.slug)}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      padding: 0,
                      textAlign: 'left',
                      cursor: 'pointer',
                      color: T2,
                      fontSize: '13px'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.color = ACCENT;
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.color = T2;
                    }}
                  >
                    {
                      selectedLanguage === "hi"
                        ? (translations.hi[cat.slug] || cat.name)
                        : cat.name
                    }
                  </button>
                ))}
              </div>
            </div>

            {/* TAGS */}
            <div style={{ marginTop: '28px' }}>
              <h3
                style={{
                  fontSize: '16px',
                  fontWeight: 700,
                  color: T1,
                  marginBottom: '14px'
                }}
              >
                {selectedLanguage === "hi"
                  ? "लोकप्रिय टैग"
                  : "Popular Tags"}
              </h3>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '10px 20px'
                }}
              >
                {(allTags.length > 0
                  ? allTags
                  : ['Politics', 'India', 'Sports', 'Tech']
                ).slice(0, 12).map((tag, index) => {
                  const tagName =
                    typeof tag === 'string'
                      ? tag
                      : tag.name;
                  const tagColor =
                    typeof tag === 'string'
                      ? ACCENT
                      : (tag.color || ACCENT);
                  return (
                    <button
                      key={tag.id || tagName || index}
                      onClick={() => {
                        setSearchQuery(tagName);
                        fetchNews(selectedCategory, tagName, 1);
                      }}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        padding: 0,
                        textAlign: 'left',
                        cursor: 'pointer',
                        color: tagColor,
                        fontSize: '13px'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.color = ACCENT;
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.color = T2;
                      }}
                    >
                      #{tagName}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* TRENDING */}
            <div style={{ marginTop: '28px' }}>
              <h3
                style={{
                  fontSize: '16px',
                  fontWeight: 700,
                  color: T1,
                  marginBottom: '14px'
                }}
              >
                {selectedLanguage === "hi"
                  ? "ट्रेंडिंग टॉपिक"
                  : "Trending Topics"}
              </h3>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}
              >
                {(breakingNews.length > 0
                  ? breakingNews
                  : news
                ).slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedNews(item)}
                    style={{
                      cursor: 'pointer',
                      color: T2,
                      fontSize: '13px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {item.title}
                  </div>
                ))}
              </div>
            </div>

            {/* MOBILE RIGHT SECTION MOVED BELOW */}
            {windowWidth <= 725 && (
              <div style={{ marginTop: '34px', width: '100%', maxWidth: '100%', overflow: 'hidden' }}>

                {/* NEWSLETTER */}
                <h3
                  style={{
                    fontSize: windowWidth <= 360 ? '15px' : '16px',
                    fontWeight: 700,
                    color: T1,
                    marginBottom: windowWidth <= 360 ? '10px' : '14px',
                    lineHeight: 1.3
                  }}
                >
                  {selectedLanguage === "hi"
                    ? "न्यूज़लेटर"
                    : "Newsletter"}
                </h3>

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: windowWidth <= 360 ? '6px' : '10px',
                    width: '100%',
                    maxWidth: '100%'
                  }}
                >
                  <input
                    type="email"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    placeholder={
                      selectedLanguage === "hi"
                        ? "ईमेल दर्ज करें"
                        : "Enter your email"
                    }
                    style={{
                      width: '100%',
                      maxWidth: '100%',
                      display: 'block',
                      boxSizing: 'border-box',
                      padding: windowWidth <= 360 ? '9px 10px' : '11px 12px',
                      borderRadius: '10px',
                      border: `1px solid ${bdr}`,
                      backgroundColor: dark ? '#1f2937' : '#fff',
                      color: T1,
                      outline: 'none',
                      fontSize: windowWidth <= 360 ? '11px' : '14px'
                    }}
                  />

                 <button
                    onClick={handleNewsletterSubscribe}
                    disabled={newsletterLoading}
                    style={{
                      width: '100%',
                      maxWidth: '100%',
                      display: 'block',
                      padding: windowWidth <= 360 ? '9px' : '11px',
                      borderRadius: '10px',
                      border: 'none',
                      backgroundColor: ACCENT,
                      color: '#fff',
                      fontWeight: 600,
                      cursor: 'pointer',
                      opacity: newsletterLoading ? 0.7 : 1,
                      fontSize: windowWidth <= 360 ? '11px' : '14px',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {newsletterLoading
                      ? (selectedLanguage === "hi" ? "लोड हो रहा..." : "Loading...")
                      : (selectedLanguage === "hi" ? "सब्सक्राइब" : "Subscribe")}
                  </button>
                </div>

                {/* LOGO */}
                <div style={{ marginTop: '26px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Image
                    src="/LOGO1.jpeg"
                    alt="Logo mark"
                    width={40}
                    height={40}
                    style={{ boxShadow: '0 0 10px rgba(255, 255, 255, 0.8)' }}
                  />
                  <Image
                    src="/logo.svg"
                    alt="Logo"
                    width={120}
                    height={40}
                  />
                </div>

                {/* CONTACTS */}
                <div
                  style={{
                    marginTop: '18px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    color: T2,
                    fontSize: '13px'
                  }}
                >
                  <div>📧 support@newsdesk.com</div>
                  <div>📍 Gurgaon, India</div>

                  <div
                    style={{
                      display: 'flex',
                      gap: '14px',
                      marginTop: '6px',
                      fontSize: '18px'
                    }}
                  >
                    <span style={{ cursor: 'pointer' }}>📘</span>
                    <span style={{ cursor: 'pointer' }}>📷</span>
                    <span style={{ cursor: 'pointer' }}>🐦</span>
                    <span style={{ cursor: 'pointer' }}>▶️</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT SIDE */}
          {windowWidth > 725 && (
            <div style={{
              width: '100%',
              maxWidth: '100%',
              overflow: 'hidden'
            }}>

              {/* NEWSLETTER */}
              <h3
                style={{
                  fontSize: '16px',
                  fontWeight: 700,
                  color: T1,
                  marginBottom: '14px',
                  lineHeight: 1.3
                }}
              >
                {selectedLanguage === "hi"
                  ? "न्यूज़लेटर"
                  : "Newsletter"}
              </h3>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  width: '100%',
                  maxWidth: '100%'
                }}
              >
                <input
                  type="email"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder={
                    selectedLanguage === "hi"
                      ? "ईमेल दर्ज करें"
                      : "Enter your email"
                  }
                  style={{
                    width: '100%',
                    maxWidth: '100%',
                    display: 'block',
                    boxSizing: 'border-box',
                    padding: '11px 12px',
                    borderRadius: '10px',
                    border: `1px solid ${bdr}`,
                    backgroundColor: dark ? '#1f2937' : '#fff',
                    color: T1,
                    outline: 'none',
                    fontSize: '14px'
                  }}
                />
                <button
                  onClick={handleNewsletterSubscribe}
                  disabled={newsletterLoading}
                  style={{
                    width: '100%',
                    maxWidth: '100%',
                    display: 'block',
                    boxSizing: 'border-box',
                    padding: '11px 12px',
                    borderRadius: '10px',
                    border: 'none',
                    backgroundColor: ACCENT,
                    color: '#fff',
                    fontWeight: 600,
                    cursor: 'pointer',
                    opacity: newsletterLoading ? 0.7 : 1,
                    whiteSpace: 'nowrap'
                  }}
                >
                  {newsletterLoading
                    ? (selectedLanguage === "hi" ? "लोड हो रहा..." : "Loading...")
                    : (selectedLanguage === "hi" ? "सब्सक्राइब" : "Subscribe")}
                </button>
              </div>

              {/* LOGO */}
              <div style={{ marginTop: '34px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Image
                  src="/LOGO1.jpeg"
                  alt="Logo mark"
                  width={40}
                  height={40}
                  style={{ boxShadow: '0 0 10px rgba(255, 255, 255, 0.8)' }}
                />
                <Image
                  src="/logo.svg"
                  alt="Logo"
                  width={120}
                  height={40}
                />
              </div>

              {/* CONTACTS */}
              <div
                style={{
                  marginTop: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  color: T2,
                  fontSize: '13px'
                }}
              >
                <div>📧 support@newsdesk.com</div>
                <div>📍 Gurgaon, India</div>

                <div
                  style={{
                    display: 'flex',
                    gap: '14px',
                    marginTop: '6px',
                    fontSize: '18px'
                  }}
                >
                  <span style={{ cursor: 'pointer' }}>📘</span>
                  <span style={{ cursor: 'pointer' }}>📷</span>
                  <span style={{ cursor: 'pointer' }}>🐦</span>
                  <span style={{ cursor: 'pointer' }}>▶️</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* BOTTOM */}
        <div
          style={{
            marginTop: '28px',
            borderTop: `1px solid ${bdr}`,
            paddingTop: '14px',
            textAlign: 'center',
            color: T3,
            fontSize: '12px'
          }}
        >
          © 2026 NewsDesk. All rights reserved.
        </div>
      </footer>
      )}
    </DarkCtx.Provider>
  );
}