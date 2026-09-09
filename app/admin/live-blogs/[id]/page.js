'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'sonner';
import { DS } from '@/components/admin/design-system';
import { Sidebar } from '@/components/admin/Sidebar';
import { Header } from '@/components/admin/Header';
import { LiveBlogManageView } from '@/components/admin/liveBlogs/LiveBlogManageView';

export default function LiveBlogManagePage() {
  const router = useRouter();
  const params = useParams();
  const blogId = params?.id;

  const [currentUser, setCurrentUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  const [blog, setBlog] = useState(null);
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draftContent, setDraftContent] = useState('');
  const [posting, setPosting] = useState(false);

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

  // Blog metadata isn't exposed via a dedicated GET-one admin route (list
  // already returns every field the manage view needs) — reusing the list
  // endpoint filtered client-side avoids adding a fourth near-duplicate
  // route for the same document shape.
  const fetchBlog = useCallback(async () => {
    try {
      const res = await authFetch('/api/admin/live-blogs?limit=200');
      const data = await res.json();
      const found = (data.blogs || []).find((b) => b.id === blogId);
      setBlog(found || null);
    } catch (error) {
      console.error('Error fetching live blog:', error);
    }
  }, [authFetch, blogId]);

  const fetchUpdates = useCallback(async () => {
    try {
      const res = await authFetch(`/api/admin/live-blogs/${blogId}/updates?limit=100`);
      const data = await res.json();
      setUpdates(data.updates || []);
    } catch (error) {
      console.error('Error fetching updates:', error);
    }
  }, [authFetch, blogId]);

  useEffect(() => {
    if (!currentUser || !blogId) return;
    (async () => {
      setLoading(true);
      await Promise.all([fetchBlog(), fetchUpdates()]);
      setLoading(false);
    })();
  }, [currentUser, blogId, fetchBlog, fetchUpdates]);

  const handleStatusChange = async (status) => {
    try {
      const res = await authFetch(`/api/admin/live-blogs/${blogId}`, { method: 'PUT', body: JSON.stringify({ status }) });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to update status');
      setBlog(data.blog);
      toast.success(`Status changed to "${status}"`);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handlePostUpdate = async (status) => {
    if (!draftContent.trim() || posting) return;
    setPosting(true);
    try {
      const res = await authFetch(`/api/admin/live-blogs/${blogId}/updates`, {
        method: 'POST',
        body: JSON.stringify({ content: draftContent.trim(), status }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to post update');
      setDraftContent('');
      toast.success(status === 'draft' ? 'Saved as draft' : 'Update published');
      fetchUpdates();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setPosting(false);
    }
  };

  const handleEditUpdate = async (updateId, content) => {
    try {
      const res = await authFetch(`/api/admin/live-blogs/${blogId}/updates/${updateId}`, { method: 'PUT', body: JSON.stringify({ content }) });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to save');
      toast.success('Update saved');
      fetchUpdates();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handlePublishUpdate = async (updateId) => {
    try {
      const res = await authFetch(`/api/admin/live-blogs/${blogId}/updates/${updateId}`, { method: 'PUT', body: JSON.stringify({ status: 'published' }) });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to publish');
      toast.success('Update published');
      fetchUpdates();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleDeleteUpdate = async (updateId) => {
    if (!confirm('Delete this update?')) return;
    try {
      const res = await authFetch(`/api/admin/live-blogs/${blogId}/updates/${updateId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to delete');
      toast.success('Update deleted');
      fetchUpdates();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleTabChange = (id) => {
    if (id === 'calendar') { router.push('/admin/editorial-calendar'); return; }
    if (id === 'breaking-news') { router.push('/admin/breaking-news'); return; }
    router.push(id === 'live-blogs' ? '/admin/live-blogs' : `/admin?tab=${id}`);
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
        activeTab="live-blogs" onTabChange={handleTabChange}
        currentUser={currentUser} isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)} isMobile={isMobile}
      />

      <div style={DS.main(!isMobile)}>
        <Header
          currentUser={currentUser} onLogout={handleLogout}
          searchQuery="" onSearchChange={() => {}}
          activeTab="live-blogs"
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ height: '100%', overflowY: 'auto', minWidth: 0 }}>
            <LiveBlogManageView
              blog={blog} updates={updates} loading={loading}
              onBack={() => router.push('/admin/live-blogs')}
              onStatusChange={handleStatusChange}
              draftContent={draftContent} setDraftContent={setDraftContent}
              onPostUpdate={handlePostUpdate} posting={posting}
              onEditUpdate={handleEditUpdate}
              onDeleteUpdate={handleDeleteUpdate}
              onPublishUpdate={handlePublishUpdate}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
