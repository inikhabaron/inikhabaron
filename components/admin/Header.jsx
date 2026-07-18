'use client';

import { Home, ChevronRight, Search, X, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { DS } from './design-system';

const BREADCRUMBS = {
  dashboard: ['Dashboard'], news: ['Posts'], categories: ['Categories'],
  users: ['Users'], livestream: ['Live Stream'], calendar: ['Editorial Calendar'],
};

export function Header({ currentUser, onLogout, searchQuery, onSearchChange, activeTab }) {
  const crumbs = BREADCRUMBS[activeTab] || [activeTab];
  const router = useRouter();

  return (
    <div style={DS.header}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#6b7280', fontSize: 13 }}>
          <Home
            size={14}
            color="#9ca3af"
            style={{ cursor: 'pointer' }}
            onClick={() => router.push('/')}
          />
          {crumbs.map((b, i) => (
            <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <ChevronRight size={12} color="#d1d5db" />
              <span style={{ color: i === crumbs.length - 1 ? '#374151' : '#6b7280', fontWeight: i === crumbs.length - 1 ? 500 : 400 }}>{b}</span>
            </span>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={14} style={{ position: 'absolute', left: 11, color: '#9ca3af', pointerEvents: 'none' }} />
          <input
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Search articles..."
            style={{ ...DS.input, paddingLeft: 34, width: 220, fontSize: 13, background: '#f9fafb', border: '1px solid #f0f0f0' }}
          />
          {searchQuery && (
            <button onClick={() => onSearchChange('')} style={{ position: 'absolute', right: 10, background: 'transparent', border: 'none', cursor: 'pointer', color: '#9ca3af', display: 'flex' }}>
              <X size={13} />
            </button>
          )}
        </div>

        <div style={{ width: 1, height: 26, background: '#e5e7eb' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#667eea,#764ba2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, color: '#fff', flexShrink: 0 }}>
            {currentUser?.name?.[0] || 'A'}
          </div>
          <span style={{ fontSize: 13, fontWeight: 500, color: '#374151', whiteSpace: 'nowrap' }}>
            {currentUser?.name || 'Admin'}
          </span>
        </div>

        <button onClick={onLogout} style={{ ...DS.btn('ghost'), color: '#6b7280', padding: '6px 8px' }} title="Logout">
          <LogOut size={15} />
        </button>
      </div>
    </div>
  );
}
