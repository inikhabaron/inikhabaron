'use client';
import React from 'react';
import { Search } from 'lucide-react';
import { ACCENT } from '@/lib/news-utils';

export default function MobileSearch({
  dark, bdr, T1, T2, T3,
  searchQuery, setSearchQuery,
  tags, news, loading,
  isSearchActive, setIsSearchActive,
  selectedCategory,
  onClose, onSearch, onArticleClick,
  formatDate,
}) {
  const handleTagClick = (tagName) => {
    setSearchQuery(tagName);
    setIsSearchActive(true);
    onSearch(tagName);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: dark ? '#141620' : '#fff', zIndex: 400, display: 'flex', flexDirection: 'column', padding: '14px' }}>
      {/* Search bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button onClick={onClose} style={{ border: 'none', background: 'transparent', color: dark ? '#fff' : '#141620', cursor: 'pointer' }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div style={{ flex: 1, position: 'relative' }}>
          <input
            autoFocus
            placeholder="खबर, टॉपिक, शहर या राज्य खोजें"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { setIsSearchActive(true); onSearch(searchQuery); } }}
            style={{ width: '100%', padding: '10px 40px 10px 14px', borderRadius: '10px', border: `1px solid ${bdr}`, backgroundColor: dark ? '#1e2130' : '#f3f4f6', color: T1, fontSize: '14px', outline: 'none' }}
          />
          <Search
            onClick={() => { setIsSearchActive(true); onSearch(searchQuery); }}
            style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', width: '18px', height: '18px', color: ACCENT, cursor: 'pointer' }}
          />
        </div>
      </div>

      {/* Trending tags */}
      {!isSearchActive && (
        <div style={{ marginTop: '20px' }}>
          <p style={{ color: '#D72638', fontSize: '14px', marginBottom: '12px', fontWeight: 700 }}>ट्रेंडिंग</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {(tags.length > 0 ? tags : ['बंगाल में हिंसा', 'IPL 2026', 'गर्मी की मार']).map((tag, i) => {
              const name = typeof tag === 'string' ? tag : tag.name;
              return (
                <button key={typeof tag === 'string' ? tag : (tag.id || i)} onClick={() => handleTagClick(name)}
                  style={{ padding: '8px 14px', borderRadius: '20px', border: `1px solid ${bdr}`, background: 'transparent', color: T2, fontSize: '13px', cursor: 'pointer' }}>
                  {name} →
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Search results */}
      {isSearchActive && (
        <div style={{ marginTop: '16px', overflowY: 'auto' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}><div className="loader" /></div>
          ) : news.length === 0 ? (
            <p style={{ textAlign: 'center', color: ACCENT, fontWeight: 500 }}>कोई रिजल्ट नहीं मिला</p>
          ) : news.map(item => (
            <div key={item.id} onClick={() => { onClose(); onArticleClick(item); }}
              style={{ display: 'flex', gap: '10px', padding: '12px 0', borderBottom: `1px solid ${bdr}`, cursor: 'pointer' }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '14px', fontWeight: 600, color: dark ? '#fff' : '#000', margin: 0 }}>{item.title}</p>
                <p style={{ fontSize: '12px', color: T3, marginTop: '6px', marginBottom: 0 }}>{formatDate(item.publishedAt)}</p>
              </div>
              {item.featuredImage && (
                <img src={item.featuredImage} alt={item.title} style={{ width: '90px', height: '60px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
