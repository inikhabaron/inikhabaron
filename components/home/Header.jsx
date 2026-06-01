'use client';
import React, { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import { Search, Sun, Moon, User, Home, LogOut as LogOutIcon, Bell, ChevronDown } from 'lucide-react';
import { FaChromecast, FaRegUser, FaFacebookF, FaXTwitter, FaYoutube, FaInstagram } from 'react-icons/fa6';
import styles from './Header.module.css';

const ACCENT        = '#3BAFDA';
const EDITORIAL_RED = '#D72638';
const NAV_BG        = '#1a2744';
const TOP_BAR_BG    = '#111111';

export default function Header({
  dark, toggleDark,
  selectedLanguage, setSelectedLanguage, translations,
  user, onSignIn, onSignOut,
  categories, selectedCategory, setSelectedCategory,
  searchQuery, setSearchQuery, onSearch,
  breakingNews,
  isMobileView,
  setShowMobileSearch, setIsSearchActive,
  t,
  surface, bdr, T1, T2, T3,
}) {
  const profileRef  = useRef(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  useEffect(() => {
    function handleOutside(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfileMenu(false);
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  // Build nav items list
  const navItems = [
    { label: selectedLanguage === 'hi' ? 'होम'       : 'Home',          slug: 'all',           icon: true },
    { label: selectedLanguage === 'hi' ? 'देश'        : 'Nation',      slug: 'nation' },
    { label: selectedLanguage === 'hi' ? 'राज्य'      : 'States',        slug: 'states' },
    { label: selectedLanguage === 'hi' ? 'राजनीति'   : 'Politics',      slug: 'politics' },
    { label: selectedLanguage === 'hi' ? 'दुनिया'     : 'World',         slug: 'world' },
    { label: selectedLanguage === 'hi' ? 'अर्थव्यवस्था' : 'Economy',       slug: 'economy' },
    { label: selectedLanguage === 'hi' ? 'खेल'        : 'Sports',        slug: 'sports' },
    { label: selectedLanguage === 'hi' ? 'मनोरंजन'    : 'Entertainment', slug: 'entertainment' },
    { label: selectedLanguage === 'hi' ? 'विमर्श'  : 'Opinion',    slug: 'opinion' },
    { label: selectedLanguage === 'hi' ? 'योजनाएं'   : 'Schemes',        slug: 'schemes' },
    { label: selectedLanguage === 'hi' ? 'पढ़ाई'      : 'Education',        slug: 'education' },
    { label: selectedLanguage === 'hi' ? 'नौकरी'      : 'Jobs',         slug: 'jobs' },
    { label: selectedLanguage === 'hi' ? 'किसान'      : 'Farmers',        slug: 'farmers' },
    { label: selectedLanguage === 'hi' ? 'विज्ञान'     : 'Science',         slug: 'science' },
    { label: selectedLanguage === 'hi' ? 'छलांग'      : 'Innovation',        slug: 'innovation' },
    { label: selectedLanguage === 'hi' ? 'ऑटोमोबाइल-गैजेट'     : 'Auto-Gadget',         slug: 'auto-gadget' },
    { label: selectedLanguage === 'hi' ? 'साहित्य'      : 'Literature',        slug: 'literature' },
    { label: selectedLanguage === 'hi' ? 'आध्यात्म'     : 'Spirituality',         slug: 'spirituality' },
    { label: selectedLanguage === 'hi' ? 'लोकरुचि'      : 'Lifestyle',        slug: 'lifestyle' },
    { label: selectedLanguage === 'hi' ? 'स्थानीय'     : 'Local',         slug: 'local' }
  ];

  const mobileNavItems = [
    { label: t.latestNews, slug: 'all' },
    ...categories.map(cat => ({
      label: selectedLanguage === 'hi' ? (translations.hi[cat.slug] || cat.name) : cat.name,
      slug: cat.slug,
    })),
  ];

  const topBarDate = new Date().toLocaleDateString(
    selectedLanguage === 'hi' ? 'hi-IN' : 'en-US',
    { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
  );

  // ── Profile dropdown (shared mobile + desktop) ───────────────────────────
  const ProfileDropdown = () => (
    <div ref={profileRef} style={{
      position: 'absolute', top: 'calc(100% + 8px)', right: 0,
      width: '190px', backgroundColor: surface, border: `1px solid ${bdr}`,
      borderRadius: '10px', padding: '14px',
      boxShadow: '0 10px 28px rgba(0,0,0,0.15)', zIndex: 999,
    }}>
      {user ? (
        <>
          <p style={{ fontSize: '13px', fontWeight: 600, color: T1, margin: '0 0 3px' }}>
            {user.displayName || user.email?.split('@')[0]}
          </p>
          <p style={{ fontSize: '11px', color: T3, margin: '0 0 10px' }}>{user.email}</p>
          <button
            onClick={() => { onSignOut(); setShowProfileMenu(false); }}
            style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: dark ? 'rgba(239,68,68,0.12)' : '#FEE2E2', color: '#EF4444', fontSize: '13px', fontWeight: 600 }}
          >
            <LogOutIcon size={14} />{t.logout}
          </button>
        </>
      ) : (
        <button
          onClick={() => { onSignIn(); setShowProfileMenu(false); }}
          style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: `1px solid ${bdr}`, cursor: 'pointer', backgroundColor: dark ? 'rgba(59,175,218,0.12)' : '#EBF8FF', color: ACCENT, fontSize: '13px', fontWeight: 600 }}
        >
          Sign In
        </button>
      )}
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // MOBILE HEADER
  // ─────────────────────────────────────────────────────────────────────────
  if (isMobileView) {
    return (
      <header style={{
        position: 'fixed', left: 0, top: 0, width: '100%', zIndex: 100,
        display: 'flex', flexDirection: 'column',
        backgroundColor: surface,
        borderTop: `3px solid ${EDITORIAL_RED}`,
        borderBottom: `1px solid ${bdr}`,
      }}>
        {/* Mobile top row */}
        <div style={{ height: '56px', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', borderBottom: `1px solid ${bdr}` }}>
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '6px' }}>
            <Image src="/LOGO1.jpeg" alt="INI" width={22} height={22} style={{ borderRadius: '3px', opacity: 0.9 }} />
            <div style={{ backgroundColor: '#ffffff', borderRadius: '6px', padding: '2px 6px', display: 'inline-flex' }}>
              <Image src="/khabaron-logo.jpeg" alt="KhabarON" width={100} height={34} priority style={{ objectFit: 'contain' }} />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '14px' }}>
            <Search onClick={() => { setShowMobileSearch(true); setIsSearchActive(true); }} style={{ width: '20px', height: '20px', color: T2, cursor: 'pointer' }} />
            <button onClick={toggleDark} style={{ padding: '6px', border: 'none', background: 'none', cursor: 'pointer', color: T2, display: 'flex', alignItems: 'center' }}>
              {dark ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            <div style={{ position: 'relative' }}>
              <User onClick={() => setShowProfileMenu(p => !p)} style={{ width: '20px', height: '20px', color: T2, cursor: 'pointer' }} />
              {showProfileMenu && <ProfileDropdown />}
            </div>
          </div>
        </div>

        {/* Mobile category scroll */}
        <div className="hide-scrollbar" style={{ height: '46px', display: 'flex', flexDirection: 'row', alignItems: 'center', overflowX: 'auto', padding: '0 10px', gap: '8px', backgroundColor: dark ? '#181a24' : '#fff' }}>
          {mobileNavItems.map(item => {
            const isActive = selectedCategory === item.slug;
            return (
              <button key={item.slug} onClick={() => setSelectedCategory(item.slug)}
                style={{ whiteSpace: 'nowrap', padding: '5px 14px', borderRadius: '20px', border: 'none', fontSize: '13px', cursor: 'pointer', flexShrink: 0, backgroundColor: isActive ? ACCENT : dark ? '#252838' : '#F1F3F5', color: isActive ? 'white' : T2 }}>
                {item.label}
              </button>
            );
          })}
        </div>
      </header>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // DESKTOP HEADER (3-tier)
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <header style={{ position: 'fixed', left: 0, top: 0, width: '100%', zIndex: 100 }}>

      {/* ── TIER 1: Top utility bar ────────────────────────────────────────── */}
      <div style={{ backgroundColor: TOP_BAR_BG, height: '36px', overflow: 'hidden' }}>
        <div style={{
          maxWidth: '1400px', margin: '0 auto', height: '100%', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
        }}>
          {/* Date */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.75)', whiteSpace: 'nowrap' }}>
              {topBarDate}
            </span>

            {/* <span style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '5px', backgroundColor: EDITORIAL_RED, color: 'white', fontSize: '11px', fontWeight: 700, padding: '2px 9px', borderRadius: '3px', whiteSpace: 'nowrap' }}>
              <span className="breaking-dot" />
              LIVE TV
            </span> */}
            {/* <button style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.75)', cursor: 'pointer', fontSize: '11px', padding: 0, whiteSpace: 'nowrap' }}>ई-पेपर</button> */}
            <select value={selectedLanguage} onChange={e => setSelectedLanguage(e.target.value)}
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.9)', cursor: 'pointer', fontSize: '11px', outline: 'none' }}>
              <option value="hi" style={{ color: '#000' }}>हिंदी</option>
              <option value="en" style={{ color: '#000' }}>English</option>
            </select>
          </div>

          {/* Right: utility links + social icons */}
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '14px', flexShrink: 0 }}>
            {['हमारे बारे में', 'विज्ञापन दें', 'संपर्क करें'].map(link => (
              <button key={link} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.72)', cursor: 'pointer', fontSize: '11px', padding: 0, whiteSpace: 'nowrap' }}>{link}</button>
            ))}
            <div className="kn-footer-social-row" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '10px', color: 'rgba(255,255,255,0.72)' }}>
              <button className="kn-footer-social-btn">
                <FaFacebookF size={14} />
              </button>

              <button className="kn-footer-social-btn">
                <FaXTwitter size={14} />
              </button>

              <button className="kn-footer-social-btn">
                <FaYoutube size={14} />
              </button>

              <button className="kn-footer-social-btn">
                <FaInstagram size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── TIER 2: Logo / brand area ──────────────────────────────────────── */}
      <div style={{ backgroundColor: dark ? '#161B27' : '#ffffff', borderBottom: `1px solid ${bdr}`, height: '120px' }}>
        <div style={{ 
          maxWidth: '1400px', margin: '0 auto', height: '100%', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: '20px'
        }}>
          {/* Left: INI logo */}
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
            <Image src="/LOGO1.jpeg" alt="INI" width={90} height={90} style={{ borderRadius: '0', objectFit: 'cover' }} />
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.3, fontSize: '9px', fontWeight: 800, color: dark ? '#9ca3af' : '#6B7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {/* <span>INTEGRAL NEWS</span>
              <span>OF INDIA</span> */}
            </div>
          </div>

          {/* Center: Main logo + tagline */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', flex: 1 }}>
            <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '4px 10px', display: 'inline-flex', alignItems: 'center' }}>
              <Image src="/khabaron-logo2.png" alt="KhabarON" width={300} height={83} priority style={{ objectFit: 'contain' }} />
            </div>
          </div>

          {/* Right: Search + Dark mode + Notification + Login */}
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '18px', flexShrink: 0 }}>
            {/* Search */}
            <form onSubmit={onSearch} style={{ position: 'relative' }}>
              <Search style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)', width: '13px', height: '13px', color: T3, pointerEvents: 'none' }} />
              <input
                type="search"
                placeholder={t.searchPlaceholder}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onFocus={e => (e.target.style.borderColor = ACCENT)}
                onBlur={e => (e.target.style.borderColor = bdr)}
                style={{ width: '200px', padding: '7px 12px 7px 30px', borderRadius: '8px', border: `1px solid ${bdr}`, backgroundColor: dark ? '#252E40' : '#F5F6F8', color: T1, fontSize: '13px', outline: 'none', transition: 'border-color 0.15s' }}
              />
            </form>

            {/* Dark mode */}
            <button onClick={toggleDark}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', background: 'none', border: 'none', cursor: 'pointer', padding: 0, minWidth: '40px' }}>
              {dark ? <Moon size={20} color={T2} /> : <Sun size={20} color={T2} />}
              <span style={{ fontSize: '10px', color: T3, whiteSpace: 'nowrap' }}>{selectedLanguage === 'hi' ? 'डार्क मोड' : 'Dark'}</span>
            </button>

            {/* Admin Panel */}
            <button
              onClick={() => window.location.href = '/admin'}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', background: 'none', border: 'none', cursor: 'pointer', padding: 0, minWidth: '55px' }}
            >
              <FaRegUser size={20} color={T2} />
              <span style={{ fontSize: '10px', color: T3, whiteSpace: 'nowrap' }}>
                Admin
              </span>
            </button>

            {/* Notification */}
            <button onClick={handleNotificationClick}
              style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', background: 'none', border: 'none', cursor: 'pointer', padding: 0, minWidth: '28px' }}>
              <Bell size={20} color={T2} />
              <span style={{ fontSize: '10px', color: T3, whiteSpace: 'nowrap' }}>
                Bell
              </span>
              {breakingNews.length > 0 && (
                <span style={{ position: 'absolute', top: '-2px', right: '-2px', width: '7px', height: '7px', backgroundColor: EDITORIAL_RED, borderRadius: '50%' }} />
              )}
            </button>

            {/* LIVE */}
            <button onClick={() => window.location.href = '/live'}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', background: 'none', border: 'none', cursor: 'pointer', padding: 0, minWidth: '40px' }}>
              <span
                style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '8px', fontWeight: 700 }}>
                <FaChromecast size={20} color={T2} />
              </span>
              <span
                style={{ fontSize: '10px', color: T3, whiteSpace: 'nowrap' }}>
                LIVE
              </span>
            </button>

            {/* Login / Profile */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => user ? setShowProfileMenu(p => !p) : onSignIn()}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', background: 'none', border: 'none', cursor: 'pointer', padding: 0, minWidth: '40px' }}>
                <User size={20} color={T2} />
                <span style={{ fontSize: '10px', color: T3, whiteSpace: 'nowrap' }}>
                  {user ? (user.displayName?.split(' ')[0] || 'Account') : (selectedLanguage === 'hi' ? 'लॉगिन' : 'Login')}
                </span>
              </button>
              {showProfileMenu && <ProfileDropdown />}
            </div>
          </div>
        </div>
      </div>

      {/* ── TIER 3: Navigation bar ─────────────────────────────────────────── */}
      <nav className="hide-scrollbar" style={{ backgroundColor: NAV_BG, height: '48px' }}>
        <div className="hide-scrollbar"
          style={{
            maxWidth: '1400px', margin: '0 auto', height: '100%', display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '2px', overflowX: 'auto'
          }}
        >
          {navItems.map(item => {
            const isActive = selectedCategory === item.slug;
            return (
              <button
                key={item.slug}
                onClick={() => setSelectedCategory(item.slug)}
                style={{
                  display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '5px',
                  padding: '6px 14px', borderRadius: '4px', border: 'none', cursor: 'pointer',
                  flexShrink: 0, whiteSpace: 'nowrap', transition: 'background-color 0.15s',
                  backgroundColor: isActive ? EDITORIAL_RED : 'transparent',
                  color: 'white', fontSize: '13.5px', fontWeight: isActive ? 600 : 400,
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                {item.icon && <Home size={14} style={{ flexShrink: 0 }} />}
                {item.label}
              </button>
            );
          })}

          {/* More dropdown
          <div style={{ position: 'relative', marginLeft: 'auto', flexShrink: 0 }}>
            <button
              onClick={() => setShowMoreMenu(p => !p)}
              style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '4px', padding: '6px 14px', borderRadius: '4px', border: 'none', cursor: 'pointer', backgroundColor: 'transparent', color: 'rgba(255,255,255,0.8)', fontSize: '13.5px', whiteSpace: 'nowrap' }}>
              ≡ {selectedLanguage === 'hi' ? 'और' : 'More'}
            </button>
            {showMoreMenu && (
              <div style={{ position: 'absolute', top: '48px', right: 0, backgroundColor: surface, border: `1px solid ${bdr}`, borderRadius: '8px', minWidth: '160px', boxShadow: '0 8px 20px rgba(0,0,0,0.12)', zIndex: 200, overflow: 'hidden' }}>
                <button
                  onClick={() => { window.location.href = '/admin'; setShowMoreMenu(false); }}
                  style={{ width: '100%', textAlign: 'left', padding: '10px 14px', border: 'none', background: 'transparent', cursor: 'pointer', color: T2, fontSize: '13px' }}
                  onMouseEnter={e => (e.currentTarget.style.background = dark ? '#252E40' : '#F5F6F8')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  Admin Panel
                </button>
              </div>
            )}
          </div> */}
        </div>
      </nav>
    </header>
  );
}

function handleNotificationClick() {
  if (!('Notification' in window)) { alert('Notifications not supported'); return; }
  if (Notification.permission === 'granted') {
    new Notification('KhabarON 🔔', { body: 'You are already subscribed!' }); return;
  }
  Notification.requestPermission().then(p => {
    if (p === 'granted') new Notification('Subscribed ✅', { body: 'You will receive breaking news alerts!' });
  });
}
