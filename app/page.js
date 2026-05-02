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
    farmers: "Farmers",
    science: "Science",
    leap: "Leap",
    spirituality: "Spirituality",
    localInterest: "Local Interest",
    settings: "Settings",
    language: "Language",
    typography: "Typography",
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
    farmers: "किसान",
    science: "विज्ञान",
    leap: "छलांग",
    spirituality: "आध्यात्म",
    localInterest: "लोकरुचि",
    settings: "सेटिंग्स",
    language: "भाषा",
    typography: "टाइपोग्राफी",
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

// ─── Ad Components ────────────────────────────────────────────────────────────
// const ProgrammaticAd = ({ placement, size = '728x90' }) => {
//   const dark = React.useContext(DarkCtx);
//   useEffect(() => {
//     fetch('/api/ads/impression', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ adId: `prog_${placement}_${Date.now()}`, adType: 'programmatic', placement, sessionId: getSessionId(), estimatedRevenue: 0.002 }) }).catch(() => {});
//   }, [placement]);
//   const [, height] = size.split('x').map(Number);
//   return (
//     <div style={{ height, width: '100%', backgroundColor: dark ? '#1e2130' : '#F5F6F8', border: `1px dashed ${dark ? '#2e3347' : '#E6E8EB'}`, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
//       <span style={{ fontSize: '11px', fontWeight: 500, color: '#8A8F98', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Advertisement</span>
//     </div>
//   );
// };

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

// const NativeAd = () => {
//   const dark = React.useContext(DarkCtx);
//   useEffect(() => {
//     fetch('/api/ads/impression', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ adId: `native_${Date.now()}`, adType: 'native', placement: 'in-article', sessionId: getSessionId(), estimatedRevenue: 0.005 }) }).catch(() => {});
//   }, []);
//   return (
//     <div style={{ backgroundColor: dark ? '#1e2130' : '#F5F6F8', border: `1px solid ${dark ? '#2e3347' : '#E6E8EB'}`, borderRadius: '10px', padding: '14px 16px' }}>
//       <span style={{ fontSize: '10px', fontWeight: 600, color: '#8A8F98', backgroundColor: dark ? '#2e3347' : '#E6E8EB', padding: '2px 8px', borderRadius: '4px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Sponsored</span>
//       <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
//         <div style={{ width: '52px', height: '52px', borderRadius: '8px', backgroundColor: dark ? '#2e3347' : '#dde0e6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
//           <ImageIcon style={{ width: '20px', height: '20px', color: '#8A8F98' }} />
//         </div>
//         <div>
//           <p style={{ fontSize: '13px', fontWeight: 600, color: dark ? '#d1d5db' : '#333', marginBottom: '3px' }}>Premium Content Partner</p>
//           <p style={{ fontSize: '12px', color: '#8A8F98', lineHeight: 1.5 }}>Discover exclusive offers from our trusted partners.</p>
//         </div>
//       </div>
//     </div>
//   );
// };

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
        <span style={{ fontSize: `${11 * scale}px`, fontWeight: 600, color: catColor, backgroundColor: getCatAccent(item.category), color: 'white', borderRadius: '20px', padding: '3px 10px', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}> {selectedLanguage === "hi" ? (translations.hi[item.category] || item.category) : item.category}</span>
        <h3 style={{ fontSize: `${15 * scale}px`, fontWeight: 700, color: dark ? '#e2e8f0' : '#2d3748', lineHeight: 1.4, marginBottom: '10px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.title}</h3>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
            {/* <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: dark ? '#2e3347' : '#F0F2F5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <User style={{ width: '11px', height: '11px', color: '#8A8F98' }} />
            </div> */}
            {/* <span style={{ fontSize: `${12 * scale}px`, fontWeight: 400, color: '#8A8F98', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {item.authorName || 'NewsDesk'}
              </span> */}
            {/* <span style={{ color: dark ? '#3e4557' : '#D1D5DB', fontSize: '14px' }}>·</span> */}
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [selectedFont, setSelectedFont] = useState(FONT_OPTIONS[0]);
  const [textScale, setTextScale] = useState(1);
  const [showFontToolbar, setShowFontToolbar] = useState(false);
  const contentRef = useRef(null);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const moreMenuRef = useRef(null);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [languageLoaded, setLanguageLoaded] = useState(false);

  const t = translations[selectedLanguage];

  // if (!languageLoaded) {
  //   return (
  //     <div style={{
  //       height: "100vh",
  //       display: "flex",
  //       justifyContent: "center",
  //       alignItems: "center"
  //     }}>
  //       Loading...
  //     </div>
  //   );
  // }

  const [showShareMenu, setShowShareMenu] = useState(null);
  const shareMenuRef = useRef(null);

  // persist prefs
  useEffect(() => {
    const savedLanguage = localStorage.getItem("news_language");

    if (savedLanguage) {
      setSelectedLanguage(savedLanguage);
    }

    setLanguageLoaded(true);
  }, []);

  useEffect(() => {
    if (languageLoaded) {
      localStorage.setItem("news_language", selectedLanguage);
    }
  }, [selectedLanguage, languageLoaded]);

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
            width: sidebarCollapsed ? '60px' : '250px',
            minWidth: sidebarCollapsed ? '60px' : '250px',
            backgroundColor: surface,
            borderRight: `1px solid ${bdr}`,
            display: 'flex', flexDirection: 'column',
            position: 'sticky', top: 0, height: '100vh',
            transition: 'width 0.22s ease, min-width 0.22s ease',
            zIndex: 40, overflowY: 'auto', overflowX: 'hidden',
          }}>

            {/* ── Logo row FIXED ── */}
            <div style={{
              padding: '14.7px 10.7px 10.7px',
              borderBottom: `1px solid ${bdr}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: sidebarCollapsed ? 'center' : 'space-between'
            }}>

              {/* Logo */}
              {/* <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
              </div> */}

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                <Image
                  src="/logo.svg"
                  alt="Logo"
                  
                  width = {130}
                  height = {54}
                  
                  
                />
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
                          <Loader2 style={{ animation: 'spin 1s linear infinite' }} />
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

                      {/* FOOTER TEXT */}
                      {/* <p style={{
                        textAlign: 'center',
                        fontSize: '12px',
                        color: T3,
                        marginTop: '10px'
                      }}>
                        By continuing, you agree to our Terms & Privacy Policy
                      </p> */}
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

              {/* {[
                { label: 'Account', icon: User, action: null },
                { label: 'Help & Support', icon: HelpCircle, action: null },
              ].map(({ label, icon: Icon, action }) => (
                <button
                  key={label}
                  onClick={action || undefined}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    width: '100%',
                    padding: '9px 10px',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    marginBottom: '2px',
                    backgroundColor: 'transparent',
                    color: T3,
                    justifyContent: sidebarCollapsed ? 'center' : 'flex-start'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor = hoverBg;
                    e.currentTarget.style.color = T2;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = T3;
                  }}
                >
                  <Icon style={{ width: '17px', height: '17px' }} />
                  {!sidebarCollapsed && <span>{label}</span>}
                </button>
              ))} */}

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
            </nav>

            {/* ── Font Toolbar (above dark mode toggle) ── */}
            {!sidebarCollapsed && (
              <>
                
                {/* Dark mode toggle */}
                <div style={{ padding: '12px 16px', borderTop: `1px solid ${bdr}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {dark ? <Moon style={{ width: '14px', height: '14px', color: T3 }} /> : <Sun style={{ width: '14px', height: '14px', color: T3 }} />}
                    <span style={{ fontSize: '13px', fontWeight: 500, color: T2 }}>{t.darkMode}</span>
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
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, width: '100%' }}>

            {/* Top nav bar */}
            <header style={{ backgroundColor: surface, borderBottom: `1px solid ${bdr}`, padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '54px', position: 'sticky', top: 0, zIndex: 30 }}> 
              <nav style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0  }}>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '16px', flexShrink: 0 }}>
                <button onClick={handleNotificationClick} style={{ width: '32px', height: '32px', borderRadius: '50%', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: surfaceAlt, color: T3, position: 'relative' }}>
                  <Bell style={{ width: '16px', height: '16px' }} />
                  {breakingNews.length > 0 && <span style={{ position: 'absolute', top: '6px', right: '6px', width: '7px', height: '7px', backgroundColor: '#e53e3e', borderRadius: '50%', border: `2px solid ${surface}` }} />}
                </button>
                <span style={{ color: 'rgba(255,255,255,0.4)' }}>...</span>
                {/* <button style={{ width: '32px', height: '32px', borderRadius: '50%', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: surfaceAlt, color: T3 }}>
                  <MessageCircle style={{ width: '16px', height: '16px' }} />
                </button> */}
                <form onSubmit={handleSearch}>
                  <div style={{ position: 'relative' }}>
                    <Search style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)', width: '13px', height: '13px', color: T3 }} />
                    <input type="search" placeholder={t.searchPlaceholder} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                      style={{ backgroundColor: surfaceAlt, border: `1px solid ${bdr}`, borderRadius: '8px', padding: '6px 12px 6px 28px', fontSize: '13px', color: T1, outline: 'none', width: '400px', fontFamily: selectedFont.value, transition: 'border-color 0.15s' }}
                      onFocus={e => e.target.style.borderColor = ACCENT}
                      onBlur={e => e.target.style.borderColor = bdr} />
                  </div>
                </form>
              </div>
              <div style={{ height: '24px', marginLeft: '16px'}} >
                <span style={{ fontSize: '12px', color: T3, fontFamily: selectedFont.value }}>{new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
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
            <div style={{ flex: 1, padding: '24px', width: `calc(100% - 288px)`, overflowY: 'auto' }}>

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
                    <Loader2 style={{ width: '28px', height: '28px', color: ACCENT, animation: 'spin 1s linear infinite', margin: '0 auto 10px' }} />
                    <p style={{ color: T3, fontSize: `${14 * textScale}px` }}>Loading articles...</p>
                  </div>
                </div>
              ) : (
                <>
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
                        {loading ? <Loader2 style={{ width: '14px', height: '14px', animation: 'spin 1s linear infinite', color: ACCENT }} /> : <><span>{t.loadMore}</span><ChevronDown style={{ width: '14px', height: '14px' }} /></>}
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

          {/* ═══ RIGHT SIDEBAR ════════════════════════════════════════════════ */}
          <aside style={{ width: '288px', marginTop: '54px', minWidth: '288px', backgroundColor: surface, borderLeft: `1px solid ${bdr}`, padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: '22px', position: 'fixed', right:0, top: 0, height: '93vh', overflowY: 'auto' }}>

            {/* Trending News */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <h3 style={{ fontSize: `${15 * textScale}px`, fontWeight: 700, color: T1, fontFamily: selectedFont.value }}>{t.trendingNews}</h3>
                <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: ACCENT, padding: '4px', borderRadius: '4px' }}>
                  <ChevronRight style={{ width: '16px', height: '16px' }} />
                </button>
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
                <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: T3, fontSize: '18px', lineHeight: 1, padding: '2px' }}>+</button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
                {(allTags.length > 0 ? allTags : selectedLanguage === "hi"? [
                                                                              'राजनीति',
                                                                              'विज्ञापन',
                                                                              'समाचार',
                                                                              'विकास',
                                                                              'डिजाइन',
                                                                              'वित्त',
                                                                              'फुटबॉल',
                                                                              'भविष्य',
                                                                              'यात्रा',
                                                                              'तकनीक',
                                                                              'भोजन',
                                                                              'वास्तुकला',
                                                                              'टेनिस',
                                                                              'वीडियो'
                                                                            ]
                                                                          : [
                                                                              'Politics',
                                                                              'Advertising',
                                                                              'News',
                                                                              'Development',
                                                                              'Design',
                                                                              'Finance',
                                                                              'Football',
                                                                              'Future',
                                                                              'Travel',
                                                                              'Technology',
                                                                              'Food',
                                                                              'Architecture',
                                                                              'Tennis',
                                                                              'Video'
                                                                            ]).map((tag) => (
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
                  <span style={{ position: 'absolute', top: '16px', left: '16px', backgroundColor: getCatAccent(selectedNews.category), color: 'white', fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: '20px', textTransform: 'capitalize', fontFamily: selectedFont.value }}>{selectedLanguage === "hi" ? (translations.hi[selectedNews.category] || selectedNews.category) : selectedNews.category}</span>
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