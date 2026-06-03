'use client';

import { BarChart3, FileText, Video, Tag, LayoutGrid, Users, Pencil } from 'lucide-react';
import { DS } from './design-system';
import { SIDEBAR_W } from './constants';

export function Sidebar({ activeTab, onTabChange, currentUser, isOpen, onClose, isMobile }) {
  const NAV = [
    { id: 'dashboard', icon: BarChart3, label: 'Dashboard', roles: null },
    { id: 'news', icon: FileText, label: 'Posts', roles: null },
    { id: 'livestream', icon: Video, label: 'Live Stream', roles: null },
    { id: 'categories', icon: LayoutGrid, label: 'Categories', roles: ['admin', 'editor'] },
    { id: 'tags', icon: Tag, label: 'Tags', roles: ['admin', 'editor'] },
    { id: 'users', icon: Users, label: 'Users', roles: ['admin'] },
  ];

  const visible = NAV.filter(n => !n.roles || n.roles.includes(currentUser?.role));

  const sidebarStyle = {
    ...DS.sidebar,
    transform: isMobile ? (isOpen ? 'translateX(0)' : `translateX(-${SIDEBAR_W}px)`) : 'translateX(0)',
  };

  return (
    <>
      {isMobile && isOpen && (
        <div style={DS.overlay} onClick={onClose} />
      )}
      <div style={sidebarStyle}>
        <div style={{ padding: '10px 10px 8px', borderBottom: '2px solid rgb(65, 65, 103)' }}>
          <div
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src="/khabaron-logo.jpeg" alt="KhabarON" style={{ width: '190px', height: 'auto', objectFit: 'contain', display: 'block' }}  />
          </div>
        </div>

        <nav style={{ flex: 1, paddingTop: 12, overflowY: 'auto' }}>
          {visible.map(({ id, icon: Icon, label }) => (
            <div key={id}
              style={DS.navItem(activeTab === id)}
              onClick={() => { onTabChange(id); if (isMobile) onClose(); }}
              onMouseEnter={e => { if (activeTab !== id) { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#e2e8f0'; } }}
              onMouseLeave={e => { if (activeTab !== id) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94a3b8'; } }}
            >
              <Icon size={16} />
              <span>{label}</span>
            </div>
          ))}
        </nav>

        <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.07)', fontSize: 11, color: '#475569' }}>
          (c) NewsDesk 2026
        </div>
      </div>
    </>
  );
}
