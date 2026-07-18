'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { DS } from '@/components/admin/design-system';
import { Sidebar } from '@/components/admin/Sidebar';
import { Header } from '@/components/admin/Header';
import { EditorialCalendarView } from '@/components/admin/editorialCalendar';

export default function EditorialCalendarPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setSidebarOpen(!mobile);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    const adminToken = localStorage.getItem('admin_token');
    const adminSession = localStorage.getItem('admin_session');
    if (!adminToken || !adminSession) { window.location.href = '/admin/login'; return; }
    try {
      const session = JSON.parse(adminSession);
      const role = session?.role?.toString().trim().toLowerCase();
      if (!session || !role) {
        localStorage.removeItem('admin_token'); localStorage.removeItem('admin_session');
        window.location.href = '/admin/login';
        return;
      }
      if (!['admin', 'editor'].includes(role)) { router.replace('/admin'); return; }
      setCurrentUser({ ...session, role });
    } catch (error) {
      console.error('Invalid session data:', error);
      localStorage.removeItem('admin_token'); localStorage.removeItem('admin_session');
      window.location.href = '/admin/login';
    }
  }, [router]);

  const authFetch = useCallback(async (url, options = {}) => {
    const token = localStorage.getItem('admin_token')?.toString().trim();
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}`, 'x-admin-token': token } : {}),
      ...(options.headers || {}),
    };
    return fetch(url, { ...options, headers });
  }, []);

  const handleTabChange = (id) => {
    if (id === 'calendar') return;
    router.push(`/admin?tab=${id}`);
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_session');
    window.location.href = '/admin/login';
  };

  if (!currentUser) return null;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'DM Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>
      <Sidebar
        activeTab="calendar" onTabChange={handleTabChange}
        currentUser={currentUser} isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)} isMobile={isMobile}
      />

      <div style={DS.main(!isMobile)}>
        <Header
          currentUser={currentUser} onLogout={handleLogout}
          searchQuery="" onSearchChange={() => {}}
          activeTab="calendar"
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ height: '100%', overflowY: 'auto', minWidth: 0 }}>
            <EditorialCalendarView authFetch={authFetch} currentUser={currentUser} />
          </div>
        </div>
      </div>
    </div>
  );
}
