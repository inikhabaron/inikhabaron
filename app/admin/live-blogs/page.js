'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { DS } from '@/components/admin/design-system';
import { Sidebar } from '@/components/admin/Sidebar';
import { Header } from '@/components/admin/Header';
import { LiveBlogsListView } from '@/components/admin/LiveBlogsListView';
import { LiveBlogFormDialog } from '@/components/admin/LiveBlogFormDialog';

const EMPTY_FORM = { title: '', type: 'general', summary: '', featuredImage: '', linkedArticleId: '' };

// Same standalone-admin-route shape as app/admin/editorial-calendar/page.js
// — its own auth check + authFetch, Sidebar/Header mounted directly,
// rather than a case inside app/admin/page.js's renderView() switch. Live
// Blog Manager is meaty enough (live-editing a growing feed, not a simple
// CRUD table) to warrant this, same reasoning as the calendar.
export default function LiveBlogsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

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

  const fetchBlogs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await authFetch('/api/admin/live-blogs?limit=50');
      const data = await res.json();
      setBlogs(data.blogs || []);
    } catch (error) {
      console.error('Error fetching live blogs:', error);
      toast.error('Failed to load live blogs');
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => { if (currentUser) fetchBlogs(); }, [currentUser, fetchBlogs]);

  const handleSave = async () => {
    try {
      const url = editingBlog ? `/api/admin/live-blogs/${editingBlog.id}` : '/api/admin/live-blogs';
      const res = await authFetch(url, {
        method: editingBlog ? 'PUT' : 'POST',
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to save');
      toast.success(editingBlog ? 'Live blog updated' : 'Live blog created');
      setDialogOpen(false);
      setForm(EMPTY_FORM);
      setEditingBlog(null);
      fetchBlogs();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (blog) => {
    if (!confirm(`Delete "${blog.title}"? This also deletes all of its updates.`)) return;
    try {
      const res = await authFetch(`/api/admin/live-blogs/${blog.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to delete');
      toast.success('Live blog deleted');
      fetchBlogs();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleTabChange = (id) => {
    if (id === 'live-blogs') return;
    if (id === 'calendar') { router.push('/admin/editorial-calendar'); return; }
    if (id === 'breaking-news') { router.push('/admin/breaking-news'); return; }
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
            <LiveBlogsListView
              blogs={blogs} loading={loading}
              onAdd={() => { setEditingBlog(null); setForm(EMPTY_FORM); setDialogOpen(true); }}
              onEdit={(blog) => {
                setEditingBlog(blog);
                setForm({
                  title: blog.title, type: blog.type, summary: blog.summary || '',
                  featuredImage: blog.featuredImage || '', linkedArticleId: blog.linkedArticleId || '',
                });
                setDialogOpen(true);
              }}
              onDelete={handleDelete}
              onManage={(blog) => router.push(`/admin/live-blogs/${blog.id}`)}
            />
          </div>
        </div>
      </div>

      <LiveBlogFormDialog
        open={dialogOpen} onOpenChange={setDialogOpen}
        editingBlog={editingBlog}
        form={form} setForm={setForm}
        onSave={handleSave}
      />
    </div>
  );
}
