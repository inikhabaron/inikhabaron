'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { DS } from '@/components/admin/design-system';
import { Sidebar } from '@/components/admin/Sidebar';
import { Header } from '@/components/admin/Header';
import { DashboardView } from '@/components/admin/DashboardView';
import { NewsListView } from '@/components/admin/NewsListView';
import { CategoriesView } from '@/components/admin/CategoriesView';
import { TagsView } from '@/components/admin/TagsView';
import { UsersView } from '@/components/admin/UsersView';
import { LiveStreamView } from '@/components/admin/LiveStreamView';
import { NewsFormDialog } from '@/components/admin/NewsFormDialog';
import { CategoryFormDialog } from '@/components/admin/CategoryFormDialog';
import { TagFormDialog } from '@/components/admin/TagFormDialog';
import { UserFormDialog } from '@/components/admin/UserFormDialog';
import { VersionHistoryDialog } from '@/components/admin/VersionHistoryDialog';

const EMPTY_NEWS_FORM = {
  title: '', content: '', excerpt: '', category: '', tags: '', featuredImage: '', images: [],
  status: 'draft', isBreaking: false, breakingSuggested: false, isTrending: false,
  trendingSuggested: false, isFeatured: false, authorName: 'Admin',
  source: '', sourceUrl: '', seoTitle: '', seoDescription: '', seoKeywords: '', scheduledAt: '',
};

const EMPTY_CATEGORY_FORM = {
  name: '', slug: '', description: '', color: '#3B82F6', order: 0, isActive: true,
};

const EMPTY_TAG_FORM = {
  name: '', slug: '', description: '', color: '#8b5cf6', isActive: true,
};

const EMPTY_USER_FORM = {
  name: '', email: '', role: 'reporter', isVerified: false, bio: '',
  canPublishScheduled: false, canPublishBreaking: false,
};

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [news, setNews] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [users, setUsers] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newsStatusFilter, setNewsStatusFilter] = useState('all');
  const [currentUser, setCurrentUser] = useState(null);

  const [editingNews, setEditingNews] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingTag, setEditingTag] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [isNewsDialogOpen, setIsNewsDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isTagDialogOpen, setIsTagDialogOpen] = useState(false);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false);
  const [versionHistory, setVersionHistory] = useState([]);

  const [newsForm, setNewsForm] = useState(EMPTY_NEWS_FORM);
  const [categoryForm, setCategoryForm] = useState(EMPTY_CATEGORY_FORM);
  const [tagForm, setTagForm] = useState(EMPTY_TAG_FORM);
  const [userForm, setUserForm] = useState(EMPTY_USER_FORM);
  const [ytForm, setYtForm] = useState({ videoId: '', channelId: '', title: '', isLive: false });
  const [ytSaving, setYtSaving] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
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

  const getAuthHeaders = () => {
    const token = localStorage.getItem('admin_token')?.toString().trim();
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}`, 'x-admin-token': token } : {}),
    };
  };

  const authFetch = async (url, options = {}) => {
    const token = localStorage.getItem('admin_token')?.toString().trim();
    const authUrl = token ? `${url}${url.includes('?') ? '&' : '?'}token=${encodeURIComponent(token)}` : url;
    const headers = { ...getAuthHeaders(), ...(options.headers || {}) };
    return fetch(authUrl, { ...options, headers });
  };

  useEffect(() => {
    const checkAdminAuth = () => {
      const adminToken = localStorage.getItem('admin_token');
      const adminSession = localStorage.getItem('admin_session');
      if (!adminToken || !adminSession) { window.location.href = '/admin/login'; return; }
      try {
        const session = JSON.parse(adminSession);
        if (!session || !session.role) {
          localStorage.removeItem('admin_token'); localStorage.removeItem('admin_session');
          window.location.href = '/admin/login';
        }
        setCurrentUser({ ...session, role: session.role?.toString().trim().toLowerCase() });
      } catch (error) {
        console.error('Invalid session data:', error);
        localStorage.removeItem('admin_token'); localStorage.removeItem('admin_session');
        window.location.href = '/admin/login';
      }
    };
    checkAdminAuth();
  }, []);

  const fetchNews = useCallback(async () => {
    try {
      let url = '/api/admin/news?limit=100';
      if (newsStatusFilter !== 'all') url += `&status=${newsStatusFilter}`;
      if (currentUser?.role === 'reporter') url += `&authorId=${currentUser.id}`;
      else if (currentUser?.role === 'editor') url += '&workflow=editor';
      const res = await authFetch(url, { method: 'GET' });
      const data = await res.json();
      setNews(data.news || []);
    } catch (error) {
      console.error('Error fetching news:', error);
      toast.error('Failed to fetch news');
    }
  }, [newsStatusFilter, currentUser]);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await authFetch('/api/admin/categories', { method: 'GET' });
      const data = await res.json();
      setCategories(data.categories || []);
    } catch (error) { console.error('Error fetching categories:', error); }
  }, []);

  const fetchTags = useCallback(async () => {
    try {
      const res = await authFetch('/api/admin/tags', {
        method: 'GET'
      });
      const data = await res.json();
      setTags(data.tags || []);
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await authFetch('/api/admin/users', { method: 'GET' });
      const data = await res.json();
      setUsers(data.users || []);
    } catch (error) { console.error('Error fetching users:', error); }
  }, []);

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await authFetch('/api/admin/analytics', { method: 'GET' });
      const data = await res.json();
      setAnalytics(data);
    } catch (error) { console.error('Error fetching analytics:', error); }
  }, []);

  const fetchYtConfig = useCallback(async () => {
    try {
      const res = await authFetch('/api/admin/youtube-config', { method: 'GET' });
      const data = await res.json();
      if (data.config) {
        setYtForm({
          videoId: data.config.videoId || '', channelId: data.config.channelId || '',
          title: data.config.title || '', isLive: data.config.isLive || false,
        });
      }
    } catch (error) { console.error('Error fetching YouTube config:', error); }
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchCategories(), fetchTags()]);
      if (activeTab === 'dashboard') await fetchAnalytics();
      else if (activeTab === 'news') await fetchNews();
      else if (activeTab === 'users' && currentUser?.role === 'admin') await fetchUsers();
      else if (activeTab === 'livestream') await fetchYtConfig();
      setLoading(false);
    };
    load();
  }, [activeTab, fetchCategories, fetchAnalytics, fetchNews, fetchUsers, fetchYtConfig, currentUser]);

  useEffect(() => {
    if (activeTab === 'news') fetchNews();
  }, [newsStatusFilter, activeTab, fetchNews]);

  const saveYtConfig = async () => {
    setYtSaving(true);
    try {
      const res = await authFetch('/api/admin/youtube-config', { method: 'POST', body: JSON.stringify(ytForm) });
      if (res.ok) toast.success('Live stream config saved');
      else toast.error('Failed to save config');
    } catch { toast.error('Failed to save config'); }
    finally { setYtSaving(false); }
  };

  const clearYtConfig = async () => {
    setYtForm({ videoId: '', channelId: '', title: '', isLive: false });
    setYtSaving(true);
    try {
      await authFetch('/api/admin/youtube-config', { method: 'POST', body: JSON.stringify({ videoId: '', channelId: '', title: '', isLive: false }) });
      toast.success('Live stream cleared');
    } catch { toast.error('Failed to clear config'); }
    finally { setYtSaving(false); }
  };

  const handleSaveNews = async () => {
    try {
      const payload = {
        ...newsForm,
        images: newsForm.images,
        tags: newsForm.tags.split(',').map(t => t.trim()).filter(Boolean),
        seoKeywords: newsForm.seoKeywords.split(',').map(t => t.trim()).filter(Boolean),
        authorId: currentUser?.id || 'admin',
        authorName: currentUser?.name || newsForm.authorName,
        status: newsForm.status,
      };
      const method = editingNews ? 'PUT' : 'POST';
      const url = editingNews ? `/api/admin/news/${editingNews.id}` : '/api/admin/news';
      const res = await authFetch(url, { method, body: JSON.stringify(payload) });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const message = data?.error || `Failed to save (${res.status})`;
        console.error('Save news error response:', { status: res.status, data });
        throw new Error(message);
      }
      toast.success(editingNews ? 'News updated successfully' : 'News created successfully');
      setIsNewsDialogOpen(false);
      resetNewsForm();
      fetchNews();
    } catch (error) {
      console.error('Save news error:', error);
      toast.error(error?.message || 'Failed to save news');
    }
  };

  const handleDeleteNews = async (id) => {
    if (!confirm('Are you sure you want to delete this article?')) return;
    try {
      await authFetch(`/api/admin/news/${id}`, { method: 'DELETE' });
      toast.success('News deleted');
      fetchNews();
    } catch (error) { toast.error('Failed to delete'); }
  };

  const handleViewVersionHistory = async (articleId) => {
    try {
      const res = await authFetch(`/api/admin/news/${articleId}/versions`, { method: 'GET' });
      const data = await res.json();
      setVersionHistory(data.versions || []);
      setIsVersionHistoryOpen(true);
    } catch (error) { toast.error('Failed to load version history'); }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_session');
    window.location.href = '/admin/login';
  };

  const handleWorkflowAction = async (id, action, comment = '') => {
    try {
      const endpoint = `/api/admin/news/${id}/${action}`;
      const payload = comment
        ? { comment, userId: currentUser?.id, userName: currentUser?.name }
        : { userId: currentUser?.id, userName: currentUser?.name };
      const res = await authFetch(endpoint, { method: 'POST', body: JSON.stringify(payload) });
      if (!res.ok) throw new Error('Failed to perform action');
      toast.success(`Article ${action.replace('_', ' ')}d successfully`);
      fetchNews();
      fetchAnalytics();
    } catch (error) { toast.error(`Failed to ${action.replace('_', ' ')} article`); }
  };

  const resetNewsForm = () => {
    setNewsForm({ ...EMPTY_NEWS_FORM, authorName: currentUser?.name || 'Admin' });
    setEditingNews(null);
  };

  const openEditNews = (item) => {
    setEditingNews(item);
    setNewsForm({
      title: item.title || '', content: item.content || '', excerpt: item.excerpt || '',
      category: item.category || '', tags: item.tags?.join(', ') || '',
      featuredImage: item.featuredImage || '', status: item.status || 'draft',
      images: item.images || [],
      isBreaking: item.isBreaking || false, breakingSuggested: item.breakingSuggested || false,
      isTrending: item.isTrending || false, trendingSuggested: item.trendingSuggested || false,
      isFeatured: item.isFeatured || false, authorName: item.authorName || 'Admin',
      source: item.source || '', sourceUrl: item.sourceUrl || '',
      seoTitle: item.seoTitle || '', seoDescription: item.seoDescription || '',
      seoKeywords: item.seoKeywords?.join(', ') || '',
      scheduledAt: item.scheduledAt ? new Date(item.scheduledAt).toISOString().slice(0, 16) : '',
    });
    setIsNewsDialogOpen(true);
  };

  const handleSaveCategory = async () => {
    try {
      const method = editingCategory ? 'PUT' : 'POST';
      const url = editingCategory ? `/api/admin/categories/${editingCategory.id}` : '/api/admin/categories';
      const res = await authFetch(url, { method, body: JSON.stringify(categoryForm) });
      if (!res.ok) throw new Error('Failed to save');
      toast.success(editingCategory ? 'Category updated' : 'Category created');
      setIsCategoryDialogOpen(false);
      setCategoryForm(EMPTY_CATEGORY_FORM);
      setEditingCategory(null);
      fetchCategories();
    } catch (error) { toast.error('Failed to save category'); }
  };

  const handleDeleteCategory = async (id) => {
    if (!confirm('Are you sure?')) return;
    try {
      await authFetch(`/api/admin/categories/${id}`, { method: 'DELETE' });
      toast.success('Category deleted');
      fetchCategories();
    } catch (error) { toast.error('Failed to delete'); }
  };

  const handleSaveTag = async () => {
    try {
      const method = editingTag ? 'PUT' : 'POST';
      const url = editingTag ? `/api/admin/tags/${editingTag.id}` : '/api/admin/tags';
      const res = await authFetch(url, { method, body: JSON.stringify(tagForm) });
      if (!res.ok) throw new Error('Failed to save');
      toast.success(editingTag ? 'Tag updated' : 'Tag created');
      setIsTagDialogOpen(false);
      setTagForm(EMPTY_TAG_FORM);
      setEditingTag(null);
      fetchTags();
    } catch (error) { toast.error('Failed to save tag'); }
  };

  const handleDeleteTag = async (id) => {
    if (!confirm('Are you sure?')) return;
    try {
      await authFetch(`/api/admin/tags/${id}`, { method: 'DELETE' });
      toast.success('Tag deleted');
      fetchTags();
    } catch (error) { toast.error('Failed to delete'); }
  };

  const handleSaveUser = async () => {
    try {
      const method = editingUser ? 'PUT' : 'POST';
      const url = editingUser ? `/api/admin/users/${editingUser.id}` : '/api/admin/users';
      const res = await authFetch(url, { method, body: JSON.stringify(userForm) });
      if (!res.ok) throw new Error('Failed to save');
      toast.success(editingUser ? 'User updated' : 'User created');
      setIsUserDialogOpen(false);
      setUserForm(EMPTY_USER_FORM);
      setEditingUser(null);
      fetchUsers();
    } catch (error) { toast.error('Failed to save user'); }
  };

  const handleDeleteUser = async (id) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    try {
      await authFetch(`/api/admin/users/${id}`, { method: 'DELETE' });
      toast.success('User deleted');
      fetchUsers();
    } catch (error) { toast.error('Failed to delete user'); }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  const renderView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView analytics={analytics} loading={loading} />;
      case 'news':
        return (
          <NewsListView
            news={news} currentUser={currentUser}
            newsStatusFilter={newsStatusFilter} onStatusFilterChange={setNewsStatusFilter}
            searchQuery={searchQuery} loading={loading}
            onEdit={openEditNews} onDelete={handleDeleteNews}
            onWorkflow={handleWorkflowAction}
            onAddNew={() => { resetNewsForm(); setIsNewsDialogOpen(true); }}
            onViewVersionHistory={handleViewVersionHistory}
          />
        );
      case 'categories':
        return (
          <CategoriesView
            categories={categories} loading={loading}
            onAdd={() => { setEditingCategory(null); setCategoryForm(EMPTY_CATEGORY_FORM); setIsCategoryDialogOpen(true); }}
            onEdit={(cat) => {
              setEditingCategory(cat);
              setCategoryForm({ name: cat.name, slug: cat.slug, description: cat.description || '', color: cat.color, order: cat.order, isActive: cat.isActive });
              setIsCategoryDialogOpen(true);
            }}
            onDelete={handleDeleteCategory}
          />
        );
      case 'tags':
        return (
          <TagsView
            tags={tags} loading={loading}
            onAdd={() => { setEditingTag(null); setTagForm(EMPTY_TAG_FORM); setIsTagDialogOpen(true); }}
            onEdit={(tag) => {
              setEditingTag(tag);
              setTagForm({
                name: tag.name, slug: tag.slug,
                description: tag.description || '', color: tag.color || '#8b5cf6',
                isActive: tag.isActive !== false,
              });
              setIsTagDialogOpen(true);
            }}
            onDelete={handleDeleteTag}
          />
        );
      case 'users':
        return (
          <UsersView
            users={users} loading={loading} formatDate={formatDate}
            onAdd={() => { setEditingUser(null); setUserForm(EMPTY_USER_FORM); setIsUserDialogOpen(true); }}
            onEdit={(user) => {
              setEditingUser(user);
              setUserForm({
                name: user.name, email: user.email || '', role: user.role,
                isVerified: user.isVerified, bio: user.bio || '',
                canPublishScheduled: user.permissions?.canPublishScheduled || false,
                canPublishBreaking: user.permissions?.canPublishBreaking || false,
              });
              setIsUserDialogOpen(true);
            }}
            onDelete={handleDeleteUser}
          />
        );
      case 'livestream':
        return <LiveStreamView ytForm={ytForm} setYtForm={setYtForm} onSave={saveYtConfig} onClear={clearYtConfig} ytSaving={ytSaving} />;
      default:
        return null;
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'DM Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>
      <Sidebar
        activeTab={activeTab} onTabChange={setActiveTab}
        currentUser={currentUser} isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)} isMobile={isMobile}
      />

      <div style={DS.main(!isMobile)}>
        <Header
          currentUser={currentUser} onLogout={handleLogout}
          searchQuery={searchQuery}
          onSearchChange={(q) => { setSearchQuery(q); if (activeTab !== 'news') setActiveTab('news'); }}
          activeTab={activeTab}
        />
        <div style={{ flex: 1 }}>
          <div style={{ height: '100%', overflowY: 'auto' }}>
            {renderView()}
          </div>
        </div>
      </div>

      <NewsFormDialog
        open={isNewsDialogOpen} onOpenChange={setIsNewsDialogOpen}
        editingNews={editingNews}
        newsForm={newsForm} setNewsForm={setNewsForm}
        categories={categories} currentUser={currentUser}
        onSave={handleSaveNews}
      />

      <CategoryFormDialog
        open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}
        editingCategory={editingCategory}
        categoryForm={categoryForm} setCategoryForm={setCategoryForm}
        onSave={handleSaveCategory}
      />

      <TagFormDialog
        open={isTagDialogOpen} onOpenChange={setIsTagDialogOpen}
        editingTag={editingTag}
        tagForm={tagForm} setTagForm={setTagForm}
        onSave={handleSaveTag}
      />

      <UserFormDialog
        open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}
        editingUser={editingUser}
        userForm={userForm} setUserForm={setUserForm}
        onSave={handleSaveUser}
      />

      <VersionHistoryDialog
        open={isVersionHistoryOpen} onOpenChange={setIsVersionHistoryOpen}
        versionHistory={versionHistory} formatDate={formatDate}
      />
    </div>
  );
}
