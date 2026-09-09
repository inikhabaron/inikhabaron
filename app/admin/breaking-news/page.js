'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { DS } from '@/components/admin/design-system';
import { Sidebar } from '@/components/admin/Sidebar';
import { Header } from '@/components/admin/Header';
import { BreakingNewsManagerView } from '@/components/admin/breakingNews/BreakingNewsManagerView';

const PAGE_SIZE = 20;

// Same standalone-admin-route shape as editorial-calendar/live-blogs — a
// dedicated screen for a workflow that was previously buried inline in
// the Posts table (a "BREAKING?" badge + one dropdown action, easy to
// miss at scale). No new backend beyond the `breaking` filter param on
// the existing GET /api/admin/news — see docs/mvp3-phase1-architecture.md.
export default function BreakingNewsManagerPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  const [activeTab, setActiveTab] = useState('suggested');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [approving, setApproving] = useState(false);
  const [activeBreakingItems, setActiveBreakingItems] = useState([]);

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

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const res = await authFetch(`/api/admin/news?breaking=${activeTab === 'history' ? 'all' : activeTab}&page=${page}&limit=${PAGE_SIZE}`);
      const data = await res.json();
      setItems(data.news || []);
      setTotalPages(data.pagination?.pages || 1);
    } catch (error) {
      console.error('Error fetching breaking news:', error);
      toast.error('Failed to load breaking news');
    } finally {
      setLoading(false);
    }
  }, [authFetch, activeTab, page]);

  // The "Currently Active" banner is independent of whichever tab is
  // selected, so it's fetched separately rather than derived from `items`.
  const fetchActiveBanner = useCallback(async () => {
    try {
      const res = await authFetch('/api/admin/news?breaking=active&limit=10');
      const data = await res.json();
      setActiveBreakingItems(data.news || []);
    } catch (error) {
      console.error('Error fetching active breaking banner:', error);
    }
  }, [authFetch]);

  useEffect(() => { if (currentUser) fetchItems(); }, [currentUser, fetchItems]);
  useEffect(() => { if (currentUser) fetchActiveBanner(); }, [currentUser, fetchActiveBanner]);

  useEffect(() => { setPage(1); setSelectedIds([]); }, [activeTab]);

  const refetchAll = () => { fetchItems(); fetchActiveBanner(); };

  const handleApprove = async (id) => {
    setApproving(true);
    try {
      const res = await authFetch(`/api/admin/news/${id}/approve-breaking`, { method: 'POST', body: JSON.stringify({}) });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Approval failed');
      toast.success('Breaking news approved');
      refetchAll();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setApproving(false);
    }
  };

  // Loops the existing single-item approve-breaking route rather than a
  // new bulk endpoint — kept in scope per "no new APIs beyond the news
  // list filter."
  const handleApproveSelected = async () => {
    setApproving(true);
    try {
      const results = await Promise.all(
        selectedIds.map((id) => authFetch(`/api/admin/news/${id}/approve-breaking`, { method: 'POST', body: JSON.stringify({}) }))
      );
      const failed = results.filter((r) => !r.ok).length;
      if (failed > 0) toast.error(`${failed} of ${selectedIds.length} failed to approve`);
      else toast.success(`${selectedIds.length} article(s) approved`);
      setSelectedIds([]);
      refetchAll();
    } catch (error) {
      toast.error('Bulk approval failed');
    } finally {
      setApproving(false);
    }
  };

  const handleUnmark = async (id) => {
    setApproving(true);
    try {
      const res = await authFetch(`/api/admin/news/${id}/breaking`, { method: 'POST', body: JSON.stringify({ isBreaking: false }) });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to unmark');
      toast.success('Removed from breaking news');
      refetchAll();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setApproving(false);
    }
  };

  const toggleSelect = (id) => setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  const toggleSelectAll = () => setSelectedIds((prev) => (
    items.length > 0 && items.every((i) => prev.includes(i.id)) ? [] : items.map((i) => i.id)
  ));

  const handleTabChange = (id) => {
    if (id === 'breaking-news') return;
    if (id === 'calendar') { router.push('/admin/editorial-calendar'); return; }
    if (id === 'live-blogs') { router.push('/admin/live-blogs'); return; }
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
        activeTab="breaking-news" onTabChange={handleTabChange}
        currentUser={currentUser} isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)} isMobile={isMobile}
      />

      <div style={DS.main(!isMobile)}>
        <Header
          currentUser={currentUser} onLogout={handleLogout}
          searchQuery="" onSearchChange={() => {}}
          activeTab="breaking-news"
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ height: '100%', overflowY: 'auto', minWidth: 0 }}>
            <BreakingNewsManagerView
              activeTab={activeTab} onTabChange={setActiveTab}
              items={items} loading={loading}
              page={page} totalPages={totalPages} onPageChange={setPage}
              activeBreakingItems={activeBreakingItems}
              selectedIds={selectedIds} onToggleSelect={toggleSelect} onToggleSelectAll={toggleSelectAll}
              onApprove={handleApprove} onApproveSelected={handleApproveSelected}
              onUnmark={handleUnmark} approving={approving}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
