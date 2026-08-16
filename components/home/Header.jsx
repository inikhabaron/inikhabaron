'use client';
import React, { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import { Search, Sun, Moon, User, Home, LogOut as LogOutIcon, Bell, ChevronDown, ChevronLeft, ChevronRight, Video, MapPin, Bookmark, Users } from 'lucide-react';
import { IoHome } from "react-icons/io5";
import { FaFacebook } from "react-icons/fa";
import { FaChromecast, FaRegUser, FaFacebookF, FaXTwitter, FaYoutube, FaInstagram } from 'react-icons/fa6';
import styles from './Header.module.css';
import { useRouter } from "next/navigation";
import { toast } from 'sonner';
import useNotificationOptIn from '@/hooks/useNotificationOptIn';
import { SOCIAL_LINKS } from '@/lib/constants/social-links';

const ACCENT        = '#3BAFDA';
const EDITORIAL_RED = '#D72638';
const NAV_BG        = '#152a58';
const TOP_BAR_BG    = '#152a58';

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
  const router = useRouter();
  const { subscribed, subscribe } = useNotificationOptIn();

  useEffect(() => {
    function handleOutside(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfileMenu(false);
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const handleNotificationClick = async () => {
    if (subscribed) {
      toast.info(selectedLanguage === 'hi' ? 'आप पहले से सब्सक्राइब हैं' : 'You are already subscribed!');
      return;
    }
    const { success, error } = await subscribe();
    if (success) {
      toast.success(selectedLanguage === 'hi' ? 'सब्सक्राइब हो गया ✅' : 'Subscribed ✅ You will receive breaking news alerts!');
    } else {
      toast.error(error || (selectedLanguage === 'hi' ? 'सब्सक्राइब नहीं हो सका' : 'Unable to subscribe'));
    }
  };

  // Build nav items list
  const navItems = [
    { label: selectedLanguage === 'hi' ? 'ताज़ा खबरें' : 'Latest News', slug: 'all', icon: true, },
    ...categories.map(cat => ({
      label: selectedLanguage === 'hi' ? (cat.nameHi || cat.name) : cat.name, slug: cat.slug, color: cat.color,
    })),
  ];

  const mobileNavItems = [
    { label: t.latestNews, slug: 'all' },
    { label: selectedLanguage === 'hi' ? 'वीडियो' : 'Video', slug: 'live-video', isVideo: true, },
    { label: selectedLanguage === 'hi' ? 'मेरा शहर' : 'My City', slug: 'my-city', isMyCity: true, },
    // /cricket previously had exactly one entry point site-wide: the "View
    // All Scores" button inside the homepage widget, which is itself hidden
    // when the module is disabled or has no data — leaving the hub orphaned.
    { label: selectedLanguage === 'hi' ? 'क्रिकेट' : 'Cricket', slug: 'cricket', isCricket: true, },
    ...categories.map(cat => ({
      label: selectedLanguage === 'hi' ? (cat.nameHi || cat.name) : cat.name, slug: cat.slug,
    })),
  ];

  const navScrollRef = useRef(null);

  const [clicked, setClicked] = useState(null);
  const [topBarDate, setTopBarDate] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    const formattedDate = new Date().toLocaleDateString(
      selectedLanguage === 'hi' ? 'hi-IN' : 'en-US',
      { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
    );
    setTopBarDate(formattedDate);
  }, [selectedLanguage]);

  const scrollCategories = (dir) => {
    setClicked(dir);

    setTimeout(() => {
      setClicked(null);
    }, 500);

    const container = navScrollRef.current;
    if (!container) return;

    const amount = container.clientWidth * 0.45;

    const start = container.scrollLeft;
    const end =
      dir === "left"
        ? start - amount
        : start + amount;

    const duration = 3000;
    const startTime = performance.now();

    function animate(time) {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const easeOut = 1 - Math.pow(1 - progress, 3);

      container.scrollLeft =
        start + (end - start) * easeOut;

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    }

    requestAnimationFrame(animate);
  };

  // ── Profile dropdown (shared mobile + desktop) ───────────────────────────
  const ProfileDropdown = () => (
    <div ref={profileRef} style={{
      position: 'absolute', top: 'calc(100% + 8px)', right: 0,
      width: '190px', backgroundColor: surface, border: `1px solid ${bdr}`,
      borderRadius: '10px', padding: '14px',
      boxShadow: '0 10px 28px rgba(0,0,0,0.15)', zIndex: 300,
    }}>
      {user ? (
        <>
          <p style={{ fontSize: '13px', fontWeight: 600, color: T1, margin: '0 0 3px' }}>
            {user.displayName || user.email?.split('@')[0]}
          </p>
          <p style={{ fontSize: '11px', color: T3, margin: '0 0 10px' }}>{user.email}</p>
          <button
            onClick={() => { router.push('/saved'); setShowProfileMenu(false); }}
            style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: `1px solid ${bdr}`, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'transparent', color: T1, fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}
          >
            <Bookmark size={14} />{selectedLanguage === 'hi' ? 'सेव किए गए लेख' : 'Saved Articles'}
          </button>
          <button
            onClick={() => { router.push('/following'); setShowProfileMenu(false); }}
            style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: `1px solid ${bdr}`, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'transparent', color: T1, fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}
          >
            <Users size={14} />{selectedLanguage === 'hi' ? 'फॉलो' : 'Following'}
          </button>
          <button
            onClick={() => { router.push('/settings'); setShowProfileMenu(false); }}
            style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: `1px solid ${bdr}`, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'transparent', color: T1, fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}
          >
            <MapPin size={14} />Settings
          </button>
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
        position: 'fixed', left: 0, top: 0, width: '100%', zIndex: 50,
        display: 'flex', flexDirection: 'column',
        backgroundColor: surface,
        borderTop: `3px solid ${EDITORIAL_RED}`,
        borderBottom: `1px solid ${bdr}`,
      }}>
        {/* Mobile top row */}
        <div style={{ height: '56px', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', borderBottom: `1px solid ${bdr}` }}>
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '6px' }}>
            <Image src="/LOGO1.jpeg" alt="INI" width={40} height={40} style={{ borderRadius: '3px', opacity: 0.9 }} />
            <div style={{ backgroundColor: '#ffffff', borderRadius: '6px', padding: '2px 6px', display: 'inline-flex' }}>
              <Image src="/khabaron-logo.jpeg" alt="KhabarON" width={100} height={34} priority style={{ objectFit: 'contain' }} />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '14px' }}>
            <button
              type="button"
              onClick={() => { setShowMobileSearch(true); setIsSearchActive(true); }}
              aria-label={selectedLanguage === 'hi' ? 'खोजें' : 'Search'}
              style={{ padding: '6px', border: 'none', background: 'none', cursor: 'pointer', color: T2, display: 'flex', alignItems: 'center' }}
            >
              <Search size={20} />
            </button>
            <button
              type="button"
              onClick={toggleDark}
              aria-label={dark ? (selectedLanguage === 'hi' ? 'लाइट मोड चालू करें' : 'Switch to light mode') : (selectedLanguage === 'hi' ? 'डार्क मोड चालू करें' : 'Switch to dark mode')}
              style={{ padding: '6px', border: 'none', background: 'none', cursor: 'pointer', color: T2, display: 'flex', alignItems: 'center' }}
            >
              {dark ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setShowProfileMenu(p => !p)}
                aria-label={selectedLanguage === 'hi' ? 'खाता' : 'Account'}
                aria-expanded={showProfileMenu}
                style={{ padding: '6px', border: 'none', background: 'none', cursor: 'pointer', color: T2, display: 'flex', alignItems: 'center' }}
              >
                <User size={20} />
              </button>
              {showProfileMenu && <ProfileDropdown />}
            </div>
          </div>
        </div>

        {/* Mobile category scroll */}
        <div className="hide-scrollbar" style={{ height: '46px', display: 'flex', flexDirection: 'row', alignItems: 'center', overflowX: 'auto', padding: '0 10px', gap: '8px', backgroundColor: dark ? '#181a24' : '#fff' }}>
          {mobileNavItems.map(item => {
            const isActive = selectedCategory === item.slug;
            return (
              <button key={item.slug} onClick={() => { if (item.isVideo) { router.push('/live'); return; } if (item.isMyCity) { router.push('/my-city'); return; } if (item.isCricket) { router.push('/cricket'); return; } setSelectedCategory(item.slug); router.push(`/?category=${item.slug}`); }}
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
    <header style={{ width: '100vw', zIndex: 50 }}>

      {/* ── TIER 1: Top utility bar ────────────────────────────────────────── */}
      <div style={{ backgroundColor: TOP_BAR_BG, overflow: 'hidden' }}>
        <div className={styles.topDateDiv}>
          {/* Date */}
          <div   style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px'
          }}>
            <span style={{ fontSize: '16px', fontWeight: 600, color: 'white', whiteSpace: 'nowrap' }}>
              {topBarDate}
            </span>

            {/* <span style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '5px', backgroundColor: EDITORIAL_RED, color: 'white', fontSize: '11px', fontWeight: 700, padding: '2px 9px', borderRadius: '3px', whiteSpace: 'nowrap' }}>
              <span className="breaking-dot" />
              LIVE TV
            </span> */}
            {/* <button style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.75)', cursor: 'pointer', fontSize: '11px', padding: 0, whiteSpace: 'nowrap' }}>ई-पेपर</button> */}
            <select value={selectedLanguage} onChange={e => setSelectedLanguage(e.target.value)}
              aria-label={selectedLanguage === 'hi' ? 'भाषा चुनें' : 'Select language'}
              style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '16px', fontWeight: 600, outline: 'none' }}>
              <option value="hi" style={{ color: '#000' }}>हिंदी</option>
              <option value="en" style={{ color: '#000' }}>English</option>
            </select>
          </div>

          {/* Right: utility links + social icons */}
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '14px', flexShrink: 0 }}>
            <button
              onClick={() => router.push('/my-city')}
              style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '5px', background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '16px', fontWeight: 600, padding: 0, whiteSpace: 'nowrap' }}
            >
              <MapPin size={16} /> {selectedLanguage === 'hi' ? 'मेरा शहर' : 'My City'}
            </button>
            {[ selectedLanguage === 'hi' ? 'हमारे बारे में' : 'About Us', selectedLanguage === 'hi' ? 'विज्ञापन दें' : 'Advertise with us', selectedLanguage === 'hi' ? 'संपर्क करें' : 'Contact Us'].map(link => (
              <button key={link} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '16px', fontWeight: 600, padding: 0, whiteSpace: 'nowrap' }}>{link}</button>
            ))}
            <div className="kn-footer-social-row" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '4px', color: 'white' }}>
              <a href={SOCIAL_LINKS.facebook} target="_blank" rel="noopener noreferrer" className="kn-footer-social-btn" aria-label="Facebook">
                <FaFacebook size={18} />
              </a>

              <a href={SOCIAL_LINKS.twitter} target="_blank" rel="noopener noreferrer" className="kn-footer-social-btn" aria-label="Twitter">
                <FaXTwitter size={18} />
              </a>

              <a href={SOCIAL_LINKS.youtube} target="_blank" rel="noopener noreferrer" className="kn-footer-social-btn" aria-label="YouTube">
                <FaYoutube size={18} />
              </a>

              <a href={SOCIAL_LINKS.instagram} target="_blank" rel="noopener noreferrer" className="kn-footer-social-btn" aria-label="Instagram">
                <FaInstagram size={18} />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ── TIER 2: Logo / brand area ──────────────────────────────────────── */}
      <div style={{ backgroundColor: dark ? '#161B27' : '#ffffff', borderBottom: `1px solid ${bdr}` }}>
        <div className={styles.logoMainDiv}>
          <div className={styles.logoImgDiv}>
            {/* Left: INI logo */}
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
              <Image src="/LOGO1.jpeg" alt="INI" width={170} height={170}/>
              <div style={{ color: dark ? '#9ca3af' : '#6B7280'}}>
                {/* <span>INTEGRAL NEWS</span>
                <span>OF INDIA</span> */}
              </div>
            </div>

            {/* Center: Main logo + tagline */}
            <div>
              <div style={{ color: dark ? '#9ca3af' : '#6B7280'}}>
                <Image src="/khabaron-logo2.png" alt="KhabarON" width={480} height={460} style={{ objectFit: 'contain' }} />
              </div>
            </div>
          </div>

          {/* Right: Search + Dark mode + Notification + Login */}
          <div className={styles.headerActions}>
            {/* Search */}
            {showSearch ? (
              <form onSubmit={onSearch} className={styles.searchForm}>
                <Search className={styles.searchIcon}  color={T2} />

                <input
                  autoFocus
                  type="search"
                  placeholder={t.searchPlaceholder}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onFocus={e => (e.target.style.borderColor = ACCENT)}
                  onBlur={e => {
                    e.target.style.borderColor = bdr;

                    if (!searchQuery.trim()) {
                      setShowSearch(false);
                    }
                  }}
                  className={styles.searchInput}
                  style={{
                    borderColor: bdr,
                    backgroundColor: dark ? '#252E40' : '#F5F6F8',
                    color: T1
                  }}
                />
              </form>
            ) : (
              <button
                onClick={() => setShowSearch(true)}
                className={styles.iconButton}
              >
                <div className={styles.iconCircle}>
                  <Search size={34}  color={T2} />
                </div>

                <span className={styles.iconLabel} style={{ color: dark ? '#FFFFFF' : '#152a58' }}>
                  {selectedLanguage === 'hi' ? 'खोजें' : 'Search'}
                </span>
              </button>
            )}

            {/* Dark Mode */}
            <button
              onClick={toggleDark}
              className={styles.iconButton}
            >
              <div className={styles.iconCircle}>
                {dark
                  ? <Moon size={34}  color={T2} />
                  : <Sun size={34}  color={T2} />}
              </div>

              <span className={styles.iconLabel} style={{ color: dark ? '#FFFFFF' : '#152a58' }}>
                {selectedLanguage === 'hi' ? 'डार्क मोड' : 'Dark'}
              </span>
            </button>

            {/* Admin */}
            {/* <button
              onClick={() => (window.location.href = '/admin')}
              className={styles.iconButton}
            >
              <div className={styles.iconCircle}>
                <FaRegUser size={34} color={T2} />
              </div>

              <span className={styles.iconLabel} style={{ color: T3 }}>
                {selectedLanguage === 'hi' ? 'एडमिन' : 'Admin'}
              </span>
            </button> */}

            {/* Notification */}
            <button
              onClick={handleNotificationClick}
              className={`${styles.iconButton} ${styles.notificationButton}`}
            >
              <div className={styles.iconCircle}>
                <Bell size={34}  color={T2} />
              </div>

              <span className={styles.iconLabel} style={{ color: dark ? '#FFFFFF' : '#152a58' }}>
                {selectedLanguage === 'hi' ? 'बेल' : 'Bell'}
              </span>

              {breakingNews.length > 0 && (
                <span
                  className={styles.notificationDot}
                  style={{ backgroundColor: EDITORIAL_RED }}
                />
              )}
            </button>

            {/* Login / Profile */}
            <div style={{ position: "relative" }} ref={profileRef}>
              <button
                onClick={() => user ? setShowProfileMenu(prev => !prev) : onSignIn() }
                className={styles.iconButton}
              >
                <div className={styles.iconCircle}>
                  <User size={34} color={T2} />
                </div>

                <span
                  className={styles.iconLabel}
                  style={{ color: dark ? "#FFFFFF" : "#152a58" }}
                >
                  {user
                    ? user.displayName?.split(" ")[0] || "Account"
                    : selectedLanguage === "hi"
                    ? "लॉगिन"
                    : "Login"}
                </span>
              </button>
              {showProfileMenu && <ProfileDropdown />}
            </div>
          </div>
        </div>
      </div>

      {/* ── TIER 3: Navigation bar ─────────────────────────────────────────── */}
      <nav>
        <div className={styles.navBar}  >
          <div className={styles.navBarInner}>

            {/* HOME FIXED LEFT */}

            <button className={`${styles.navFixedBtn} ${styles.navItemActive}`}
              onClick={() => router.push("/")} >
              <IoHome size={16} /> {selectedLanguage === 'hi' ? 'होम' : 'Home'}
            </button>

            {/* LEFT SCROLL */}

            <button className={`${styles.navArrow} ${ clicked === "left" ? styles.clicked : "" }`}
              onClick={() => scrollCategories("left")}
              aria-label={selectedLanguage === 'hi' ? 'श्रेणियाँ बाईं ओर स्क्रॉल करें' : 'Scroll categories left'} >
              <ChevronLeft size={18} />
            </button>

            {/* CATEGORIES */}

            <div className={styles.navCategoriesWrapper}>
                <div
                ref={navScrollRef}
                className={styles.navCategories} >
                {navItems.map((item) => {
                  const isActive = selectedCategory === item.slug;

                  return (
                    <button
                      key={item.slug}
                      className={`${styles.navItem} ${ isActive ? styles.navItemActive : "" }`}
                      onClick={() => { setSelectedCategory(item.slug); router.push(`/?category=${item.slug}`); }}
                      style={{fontSize: "16px", fontWeight: isActive ? 600 : 500}}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* RIGHT SCROLL */}

            <button className={styles.navArrow}
              onClick={() => scrollCategories("right")}
              aria-label={selectedLanguage === 'hi' ? 'श्रेणियाँ दाईं ओर स्क्रॉल करें' : 'Scroll categories right'} >
              <ChevronRight size={18} />
            </button>

            {/* CRICKET + LIVE VIDEO FIXED RIGHT */}

            <button className={styles.liveVideoBtn}
              onClick={() => router.push("/cricket")} >
              {selectedLanguage === 'hi' ? 'क्रिकेट' : 'Cricket'}
            </button>

            <button className={styles.liveVideoBtn}
              onClick={() => router.push("/live")} >
              {selectedLanguage === 'hi' ? 'वीडियो' : 'Video'}
            </button>

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
        </div>
      </nav>
    </header>
  );
}
