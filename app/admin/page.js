'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
import { CommentsView, CommentDetailsDialog } from '@/components/admin/comments';
import { NewsletterView } from '@/components/admin/newsletter';
import { ReporterMetricsView, ReporterDetailDialog } from '@/components/admin/reporterMetrics';
import { PromotionsView } from '@/components/admin/PromotionsView';
import { PromotionFormDialog } from '@/components/admin/PromotionForm/PromotionFormDialog';
import { ReelsView } from '@/components/admin/ReelsView';
import { ReelFormDialog } from '@/components/admin/ReelFormDialog';

const EMPTY_LOCATION_FORM = {
  enabled: false, scope: 'national', country: 'India', stateId: null, stateSlug: null, stateName: null, districtId: null, districtSlug: null, districtName: null,
};

const EMPTY_NEWS_FORM = {
  title: '', content: '', excerpt: '', category: '', tags: '', featuredImage: '', images: [],
  status: 'draft', isBreaking: false, breakingSuggested: false, isTrending: false,
  trendingSuggested: false, isFeatured: false, authorLabel: 'Author', authorName: 'Admin',
  source: '', sourceUrl: '', seoTitle: '', seoDescription: '', seoKeywords: '', scheduledAt: '',
  location: EMPTY_LOCATION_FORM,
};

const EMPTY_CATEGORY_FORM = {
  name: '', nameHi: '', slug: '', parentSlug: '', description: '', color: '#3B82F6', order: 0, isActive: true,
};

const EMPTY_TAG_FORM = {
  name: '', slug: '', description: '', color: '#8b5cf6', isActive: true,
};

const EMPTY_PROMOTION_FORM = {
  title: '', description: '', bannerImage: '', eventDate: '', startDate: '', endDate: '',
  status: 'active', priority: 0, buttonText: 'Read More', linkType: 'none', linkValue: '',
  category: '', isFeatured: false, showCountdown: false,
};

const EMPTY_REEL_FORM = {
  title: '', description: '', video: null, thumbnailUrl: '', category: '', tags: '',
  language: 'en', location: EMPTY_LOCATION_FORM, linkedArticleId: null, linkedArticleTitle: '',
  reporterId: '', status: 'draft', scheduledAt: '', isFeatured: false, isSensitive: false,
};

const EMPTY_USER_FORM = {
  name: '', email: '', role: 'reporter', isVerified: false, bio: '',
  canPublishScheduled: false, canPublishBreaking: false,
};

export default function AdminPage() {
  return (
    <Suspense fallback={null}>
      <AdminPageContent />
    </Suspense>
  );
}

function AdminPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(() => searchParams.get('tab') || 'dashboard');
  const [news, setNews] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [users, setUsers] = useState([]);
  const [comments, setComments] = useState([]);
  const [commentStats, setCommentStats] = useState({
    pending: 0, approved: 0, reported: 0, hidden: 0, rejected: 0,
  });
  const [commentFilter, setCommentFilter] = useState('all');
  const [selectedComment, setSelectedComment] = useState(null);
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [commentLoading, setCommentLoading] = useState(false);
  const [moderationSettings, setModerationSettings] = useState({ mode: 'auto', delaySeconds: 3, });
  const [moderationSaving, setModerationSaving] = useState(false);
  const [newsletterSubscribers, setNewsletterSubscribers] = useState([]);
  const [newsletterStats, setNewsletterStats] = useState({ total: 0, active: 0, unsubscribed: 0 });
  const [newsletterStatusFilter, setNewsletterStatusFilter] = useState('all');
  const [newsletterLanguageFilter, setNewsletterLanguageFilter] = useState('all');
  const [newsletterSearch, setNewsletterSearch] = useState('');
  const [newsletterPage, setNewsletterPage] = useState(1);
  const [newsletterHasNext, setNewsletterHasNext] = useState(false);
  const [newsletterSendType, setNewsletterSendType] = useState('monthly');
  const [newsletterSending, setNewsletterSending] = useState(false);
  const [newsletterPreviewLoading, setNewsletterPreviewLoading] = useState(false);
  const [newsletterPreviewData, setNewsletterPreviewData] = useState(null);
  const [newsletterLastSendResult, setNewsletterLastSendResult] = useState(null);
  const [newsletterForceResend, setNewsletterForceResend] = useState(false);
  const [newsletterCampaigns, setNewsletterCampaigns] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [promotionArticleOptions, setPromotionArticleOptions] = useState([]);
  const [reels, setReels] = useState([]);
  const [reelsStatusFilter, setReelsStatusFilter] = useState('all');
  const [reelsCategoryFilter, setReelsCategoryFilter] = useState('all');
  const [reporterMetrics, setReporterMetrics] = useState([]);
  const [reporterDetailOpen, setReporterDetailOpen] = useState(false);
  const [reporterDetail, setReporterDetail] = useState(null);
  const [reporterDetailLoading, setReporterDetailLoading] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newsStatusFilter, setNewsStatusFilter] = useState('all');
  const [currentUser, setCurrentUser] = useState(null);

  const [editingNews, setEditingNews] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingTag, setEditingTag] = useState(null);
  const [editingPromotion, setEditingPromotion] = useState(null);
  const [editingReel, setEditingReel] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [isNewsDialogOpen, setIsNewsDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isTagDialogOpen, setIsTagDialogOpen] = useState(false);
  const [isPromotionDialogOpen, setIsPromotionDialogOpen] = useState(false);
  const [isReelDialogOpen, setIsReelDialogOpen] = useState(false);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false);
  const [versionHistory, setVersionHistory] = useState([]);

  const [newsForm, setNewsForm] = useState(EMPTY_NEWS_FORM);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    nameHi: '',
    slug: '',
    parentSlug: '',
    description: '',
    color: '#3B82F6',
    order: 0,
    isActive: true,
  });
  const [tagForm, setTagForm] = useState(EMPTY_TAG_FORM);
  const [promotionForm, setPromotionForm] = useState(EMPTY_PROMOTION_FORM);
  const [reelForm, setReelForm] = useState(EMPTY_REEL_FORM);
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

  const fetchPromotions = useCallback(async () => {
    try {
      const res = await authFetch('/api/admin/promotions', { method: 'GET' });
      const data = await res.json();
      setPromotions(data.promotions || []);
    } catch (error) {
      console.error('Error fetching promotions:', error);
      toast.error('Failed to fetch promotions');
    }
  }, []);

  const fetchReels = useCallback(async () => {
    try {
      let url = '/api/admin/reels?limit=100';
      if (reelsStatusFilter !== 'all') url += `&status=${reelsStatusFilter}`;
      if (reelsCategoryFilter !== 'all') url += `&category=${reelsCategoryFilter}`;
      const res = await authFetch(url, { method: 'GET' });
      const data = await res.json();
      setReels(data.reels || []);
    } catch (error) {
      console.error('Error fetching reels:', error);
      toast.error('Failed to fetch reels');
    }
  }, [reelsStatusFilter, reelsCategoryFilter]);

  // Backs the article search-picker in PromotionFormDialog — reuses the
  // existing news list endpoint rather than adding a dedicated search API,
  // same "fetch a batch, filter client-side" approach NewsListView's own
  // search box already uses.
  const fetchPromotionArticleOptions = useCallback(async () => {
    try {
      const res = await authFetch('/api/admin/news?status=published&limit=100', { method: 'GET' });
      const data = await res.json();
      setPromotionArticleOptions((data.news || []).map((n) => ({ id: n.id, title: n.title })));
    } catch (error) {
      console.error('Error fetching article options:', error);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await authFetch('/api/admin/users', { method: 'GET' });
      const data = await res.json();
      setUsers(data.users || []);
    } catch (error) { console.error('Error fetching users:', error); }
  }, []);

  const fetchComments = useCallback(async () => {
    try {
      let url = '/api/admin/comments?limit=100';
      if (commentFilter !== 'all') { url += `&status=${commentFilter}`; }
      const res = await authFetch(url);
      const data = await res.json();
      const items = data.data?.items || [];
      setComments(items);
      setCommentStats({
        pending: items.filter(c => c.status === 'pending').length,
        approved: items.filter(c => c.status === 'approved').length,
        hidden: items.filter(c => c.status === 'hidden').length,
        rejected: items.filter(c => c.status === 'rejected').length,
        reported: items.filter(c => (c.reports || 0) > 0).length,
      });
    } catch (error) {
      console.error(error);
      toast.error('Failed to fetch comments');
    }
  }, [commentFilter]);

  const fetchModerationSettings = useCallback(async () => {
    try {
        const res = await authFetch('/api/admin/settings/comment-moderation');
        const data = await res.json();
        if (data.success) { setModerationSettings(data.settings); }
    } catch (error) {
        console.error(error);
    }
  }, []);

  const fetchNewsletter = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: String(newsletterPage),
        limit: '20',
        status: newsletterStatusFilter,
        language: newsletterLanguageFilter,
      });
      if (newsletterSearch.trim()) params.set('search', newsletterSearch.trim());
      const res = await authFetch(`/api/admin/newsletter?${params.toString()}`);
      const data = await res.json();
      setNewsletterSubscribers(data.data?.items || []);
      setNewsletterHasNext(!!data.data?.hasNext);
      setNewsletterStats(data.data?.stats || { total: 0, active: 0, unsubscribed: 0 });
    } catch (error) {
      console.error('Error fetching newsletter subscribers:', error);
      toast.error('Failed to fetch subscribers');
    }
  }, [newsletterPage, newsletterStatusFilter, newsletterLanguageFilter, newsletterSearch]);

  const fetchNewsletterCampaigns = useCallback(async () => {
    try {
      const res = await authFetch('/api/admin/newsletter/campaigns?limit=10');
      const data = await res.json();
      setNewsletterCampaigns(data.data?.campaigns || []);
    } catch (error) {
      console.error('Error fetching newsletter campaigns:', error);
    }
  }, []);

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await authFetch('/api/admin/analytics', { method: 'GET' });
      const data = await res.json();
      setAnalytics(data);
    } catch (error) { console.error('Error fetching analytics:', error); }
  }, []);

  const fetchReporterMetrics = useCallback(async () => {
    try {
      const res = await authFetch('/api/admin/reporter-metrics');
      const data = await res.json();
      setReporterMetrics(data.reporters || []);
    } catch (error) {
      console.error('Error fetching reporter metrics:', error);
      toast.error('Failed to fetch reporter metrics');
    }
  }, []);

  const fetchReporterDetail = async (id) => {
    setReporterDetailOpen(true);
    setReporterDetailLoading(true);
    setReporterDetail(null);
    try {
      const res = await authFetch(`/api/admin/reporter-metrics/${id}`);
      const data = await res.json();
      setReporterDetail(data);
    } catch (error) {
      toast.error('Failed to load reporter metrics');
    } finally {
      setReporterDetailLoading(false);
    }
  };

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
      else if (activeTab === 'comments') { await Promise.all([fetchComments(), fetchModerationSettings()]); }
      else if (activeTab === 'newsletter') { await Promise.all([fetchNewsletter(), fetchNewsletterCampaigns()]); }
      else if (activeTab === 'reporter-metrics') await fetchReporterMetrics();
      else if (activeTab === 'promotions') await Promise.all([fetchPromotions(), fetchPromotionArticleOptions()]);
      else if (activeTab === 'reels') { await Promise.all([fetchReels(), fetchUsers()]); }
      setLoading(false);
    };
    load();
  }, [activeTab, fetchCategories, fetchAnalytics, fetchNews, fetchUsers, fetchComments, fetchYtConfig, fetchNewsletter, fetchNewsletterCampaigns, fetchReporterMetrics, fetchPromotions, fetchPromotionArticleOptions, fetchReels, currentUser]);

  useEffect(() => {
    if (activeTab === 'reels') fetchReels();
  }, [reelsStatusFilter, reelsCategoryFilter, activeTab, fetchReels]);

  useEffect(() => {
    const articleId = searchParams.get('openEdit');
    if (!articleId || activeTab !== 'news' || news.length === 0) return;
    const target = news.find(n => n.id === articleId);
    if (target) openEditNews(target);
    else toast.error('Could not find that article in the current list — try searching for it in Posts.');
    router.replace('/admin?tab=news');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [news, activeTab, searchParams]);

  useEffect(() => {
    if (activeTab === 'news') fetchNews();
  }, [newsStatusFilter, activeTab, fetchNews]);

  useEffect(() => {
    if (activeTab === 'comments') { fetchComments(); }
  }, [activeTab, commentFilter, fetchComments,]);

  useEffect(() => {
    if (activeTab === 'newsletter') { fetchNewsletter(); }
  }, [activeTab, newsletterPage, newsletterStatusFilter, newsletterLanguageFilter, fetchNewsletter]);

  useEffect(() => {
    if (activeTab !== 'newsletter') return;
    setNewsletterPage(1);
  }, [newsletterStatusFilter, newsletterLanguageFilter, activeTab]);

  useEffect(() => {
    if (activeTab !== 'newsletter') return;
    const timeout = setTimeout(() => {
      setNewsletterPage(1);
      fetchNewsletter();
    }, 400);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newsletterSearch]);

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
        authorLabel: newsForm.authorLabel || 'Author',
        authorName: newsForm.authorName || currentUser?.name,
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

  const handleWorkflowAction = async (id, action, comment = '', extra = {}) => {
    try {
      const endpoint = `/api/admin/news/${id}/${action}`;
      const payload = comment
        ? { comment, userId: currentUser?.id, userName: currentUser?.name, ...extra }
        : { userId: currentUser?.id, userName: currentUser?.name, ...extra };
      const res = await authFetch(endpoint, { method: 'POST', body: JSON.stringify(payload) });
      if (!res.ok) throw new Error('Failed to perform action');
      toast.success(`Article ${action.replace('_', ' ')}d successfully`);
      fetchNews();
      fetchAnalytics();
    } catch (error) { toast.error(`Failed to ${action.replace('_', ' ')} article`); }
  };

  const saveModerationSettings = async () => {
    try {
        setModerationSaving(true);
        const res = await authFetch('/api/admin/settings/comment-moderation',{ method: 'POST', body: JSON.stringify( moderationSettings), });
        if (!res.ok) { throw new Error(); }
        toast.success('Comment moderation updated');
    } catch { toast.error('Failed to save settings');
    } finally { setModerationSaving(false); }
  };

  const moderateComment = async (comment, action) => {
    try {
      setCommentLoading(true);
      const res = await authFetch(`/api/admin/comments/${comment._id}/${action}`, { method: 'POST', body: JSON.stringify({ reason: '', }), });
      if (!res.ok) { throw new Error(); }
      toast.success(`Comment ${action}d`);
      fetchComments();
      setCommentDialogOpen(false);
    } catch { toast.error(`Failed to ${action}`);
    } finally { setCommentLoading(false); }
  };

  const deleteComment = async (comment) => {
    try {
      setCommentLoading(true);
      const res = await authFetch(`/api/admin/comments/${comment._id}`, { method: 'DELETE', });
      if (!res.ok) { throw new Error(); }
      toast.success('Comment deleted');
      fetchComments();
      setCommentDialogOpen(false);
    } catch { toast.error('Delete failed');
    } finally { setCommentLoading(false); }
  };

  const resetNewsForm = () => {
    setNewsForm({ ...EMPTY_NEWS_FORM, authorLabel: 'Author', authorName: currentUser?.name || 'Admin' });
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
      isFeatured: item.isFeatured || false, authorLabel: item.authorLabel || 'Author', authorName: item.authorName || 'Admin',
      source: item.source || '', sourceUrl: item.sourceUrl || '',
      seoTitle: item.seoTitle || '', seoDescription: item.seoDescription || '',
      seoKeywords: item.seoKeywords?.join(', ') || '',
      scheduledAt: item.scheduledAt ? new Date(item.scheduledAt).toISOString().slice(0, 16) : '',
      location: item.location || EMPTY_LOCATION_FORM,
    });
    setIsNewsDialogOpen(true);
  };

  const handleSaveCategory = async () => {
    try {
      const payload = {
        name: categoryForm.name,
        nameHi: categoryForm.nameHi,
        slug: categoryForm.slug,
        parentSlug: categoryForm.parentSlug,
        description: categoryForm.description,
        color: categoryForm.color,
        order: categoryForm.order,
        isActive: categoryForm.isActive,
      };
      const method = editingCategory ? 'PUT' : 'POST';
      const url = editingCategory ? `/api/admin/categories/${editingCategory.id}` : '/api/admin/categories';
      const res = await authFetch(url, { method, body: JSON.stringify(payload) });
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

  const handleSavePromotion = async () => {
    try {
      const method = editingPromotion ? 'PUT' : 'POST';
      const url = editingPromotion ? `/api/admin/promotions/${editingPromotion.id}` : '/api/admin/promotions';
      const res = await authFetch(url, { method, body: JSON.stringify(promotionForm) });
      if (!res.ok) throw new Error('Failed to save');
      toast.success(editingPromotion ? 'Promotion updated' : 'Promotion created');
      setIsPromotionDialogOpen(false);
      setPromotionForm(EMPTY_PROMOTION_FORM);
      setEditingPromotion(null);
      fetchPromotions();
    } catch (error) { toast.error('Failed to save promotion'); }
  };

  const handleDeletePromotion = async (id) => {
    if (!confirm('Are you sure you want to delete this promotion?')) return;
    try {
      await authFetch(`/api/admin/promotions/${id}`, { method: 'DELETE' });
      toast.success('Promotion deleted');
      fetchPromotions();
    } catch (error) { toast.error('Failed to delete promotion'); }
  };

  const handleTogglePromotionStatus = async (promotion) => {
    try {
      const nextStatus = promotion.status === 'active' ? 'inactive' : 'active';
      const res = await authFetch(`/api/admin/promotions/${promotion.id}`, {
        method: 'PUT',
        body: JSON.stringify({ ...promotion, status: nextStatus }),
      });
      if (!res.ok) throw new Error();
      toast.success(nextStatus === 'active' ? 'Promotion enabled' : 'Promotion disabled');
      fetchPromotions();
    } catch (error) { toast.error('Failed to update promotion'); }
  };

  const handleSaveReel = async () => {
    try {
      const method = editingReel ? 'PUT' : 'POST';
      const url = editingReel ? `/api/admin/reels/${editingReel.id}` : '/api/admin/reels';
      const payload = {
        title: reelForm.title,
        description: reelForm.description,
        video: reelForm.video,
        thumbnail: reelForm.thumbnailUrl ? { url: reelForm.thumbnailUrl } : null,
        category: reelForm.category,
        tags: reelForm.tags.split(',').map((t) => t.trim()).filter(Boolean),
        language: reelForm.language,
        location: reelForm.location,
        linkedArticleId: reelForm.linkedArticleId || null,
        reporterId: reelForm.reporterId || currentUser?.id,
        status: reelForm.status,
        scheduledAt: reelForm.scheduledAt || null,
        isFeatured: reelForm.isFeatured,
        isSensitive: reelForm.isSensitive,
      };
      const res = await authFetch(url, { method, body: JSON.stringify(payload) });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to save');
      }
      toast.success(editingReel ? 'Reel updated' : 'Reel created');
      setIsReelDialogOpen(false);
      setReelForm(EMPTY_REEL_FORM);
      setEditingReel(null);
      fetchReels();
    } catch (error) { toast.error(error?.message || 'Failed to save reel'); }
  };

  const handleDeleteReel = async (id) => {
    if (!confirm('Are you sure you want to delete this reel?')) return;
    try {
      await authFetch(`/api/admin/reels/${id}`, { method: 'DELETE' });
      toast.success('Reel deleted');
      fetchReels();
    } catch (error) { toast.error('Failed to delete reel'); }
  };

  const handleToggleReelStatus = async (reel) => {
    try {
      const nextStatus = reel.status === 'published' ? 'unpublished' : 'published';
      const res = await authFetch(`/api/admin/reels/${reel.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) throw new Error();
      toast.success(nextStatus === 'published' ? 'Reel published' : 'Reel unpublished');
      fetchReels();
    } catch (error) { toast.error('Failed to update reel status'); }
  };

  const handleResolveReelReport = async (reel) => {
    try {
      const res = await authFetch(`/api/admin/reels/${reel.id}`, {
        method: 'PUT',
        body: JSON.stringify({ reportStatus: 'reviewed' }),
      });
      if (!res.ok) throw new Error();
      toast.success('Report marked as reviewed');
      fetchReels();
    } catch (error) { toast.error('Failed to resolve report'); }
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

  const handleApproveComment = async (comment) => {
    try {
      const res = await authFetch(`/api/admin/comments/${comment._id}/approve`, { method: 'PATCH', });
      if (!res.ok) { throw new Error(); }
      toast.success('Comment approved');
      fetchComments();
    } catch (error) { toast.error('Failed to approve comment');}
  };

  const handleRejectComment = async (comment) => {
    try {
      const res = await authFetch(`/api/admin/comments/${comment._id}/reject`, { method: 'PATCH', });
      if (!res.ok) { throw new Error(); }
      toast.success('Comment rejected');
      fetchComments();
    } catch { toast.error('Failed to reject comment'); }
  };

  const handleHideComment = async (comment) => {
    try {
      const res = await authFetch(`/api/admin/comments/${comment._id}/hide`, { method: 'PATCH', });
      if (!res.ok) { throw new Error(); }
      toast.success('Comment hidden');
      fetchComments();
    } catch { toast.error('Failed to hide comment'); }
  };

  const handleDeleteComment = async (comment) => {
    if (!confirm('Delete this comment permanently?')) { return; }
    try {
      const res = await authFetch( `/api/admin/comments/${comment._id}`, { method: 'DELETE', });
      if (!res.ok) { throw new Error();}
      toast.success('Comment deleted');
      fetchComments();
    } catch { toast.error('Failed to delete comment'); }
  };

  const handleToggleNewsletterStatus = async (subscriber) => {
    const nextStatus = subscriber.status === 'active' ? 'unsubscribed' : 'active';
    try {
      const res = await authFetch(`/api/admin/newsletter/${subscriber._id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) { throw new Error(); }
      toast.success(nextStatus === 'active' ? 'Subscriber reactivated' : 'Subscriber deactivated');
      fetchNewsletter();
    } catch { toast.error('Failed to update subscriber'); }
  };

  const handleDeleteNewsletterSubscriber = async (subscriber) => {
    if (!confirm(`Delete subscriber ${subscriber.email}?`)) { return; }
    try {
      const res = await authFetch(`/api/admin/newsletter/${subscriber._id}`, { method: 'DELETE' });
      if (!res.ok) { throw new Error(); }
      toast.success('Subscriber deleted');
      fetchNewsletter();
    } catch { toast.error('Failed to delete subscriber'); }
  };

  const handleExportNewsletterCsv = async () => {
    try {
      const params = new URLSearchParams({
        format: 'csv',
        status: newsletterStatusFilter,
        language: newsletterLanguageFilter,
      });
      if (newsletterSearch.trim()) params.set('search', newsletterSearch.trim());
      // Admin tokens only travel via headers (no query-string fallback, see
      // lib/auth/admin/token.js), so the CSV must be fetched with authFetch
      // and downloaded as a blob rather than opened as a direct URL.
      const res = await authFetch(`/api/admin/newsletter?${params.toString()}`);
      if (!res.ok) { throw new Error(); }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'newsletter-subscribers.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch { toast.error('Failed to export subscribers'); }
  };

  const handlePreviewNewsletter = async () => {
    setNewsletterPreviewLoading(true);
    try {
      const res = await authFetch(`/api/admin/newsletter/preview?type=${newsletterSendType}`);
      const data = await res.json();
      if (!res.ok || !data.success) { throw new Error(data.message || 'Preview failed'); }
      setNewsletterPreviewData(data.data);
    } catch (error) {
      toast.error(error.message || 'Failed to generate preview');
    } finally {
      setNewsletterPreviewLoading(false);
    }
  };

  const handleSendNewsletter = async () => {
    const label = newsletterSendType === 'breaking' ? 'breaking news alert' : 'monthly newsletter';
    if (!confirm(`Send the ${label} to ${newsletterStats.active || 0} active subscriber(s)? This cannot be undone.`)) {
      return;
    }
    setNewsletterSending(true);
    try {
      const res = await authFetch('/api/admin/newsletter/send', {
        method: 'POST',
        body: JSON.stringify({ type: newsletterSendType, force: newsletterForceResend }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) { throw new Error(data.message || 'Send failed'); }
      setNewsletterLastSendResult(data.data);
      setNewsletterForceResend(false);
      toast.success(data.message || 'Newsletter sent');
      fetchNewsletter();
      fetchNewsletterCampaigns();
    } catch (error) {
      toast.error(error.message || 'Failed to send newsletter');
    } finally {
      setNewsletterSending(false);
    }
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
              setCategoryForm({ name: cat.name || '', nameHi: cat.nameHi || '', slug: cat.slug || '', parentSlug: cat.parentSlug || '', description: cat.description || '', color: cat.color || '#3B82F6', order: cat.order || 0, isActive: cat.isActive ?? true, });
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
      case 'comments':
        return (
          <CommentsView
            comments={comments}
            loading={loading}
            filter={commentFilter}
            stats={commentStats}
            onFilterChange={ setCommentFilter }
            moderationSettings={ moderationSettings }
            setModerationSettings={ setModerationSettings }
            onSaveModeration={ saveModerationSettings }
            savingModeration={ moderationSaving }
            onApprove={handleApproveComment}
            onReject={handleRejectComment}
            onHide={handleHideComment}
            onDelete={handleDeleteComment}
            onPreview={(comment)=>{ 
              setSelectedComment(comment);
              setCommentDialogOpen(true);
            }}
          />
        );
      case 'newsletter':
        return (
          <NewsletterView
            subscribers={newsletterSubscribers}
            loading={loading}
            stats={newsletterStats}
            statusFilter={newsletterStatusFilter}
            onStatusFilterChange={setNewsletterStatusFilter}
            languageFilter={newsletterLanguageFilter}
            onLanguageFilterChange={setNewsletterLanguageFilter}
            searchQuery={newsletterSearch}
            onSearchChange={setNewsletterSearch}
            onExportCsv={handleExportNewsletterCsv}
            page={newsletterPage}
            hasNext={newsletterHasNext}
            onPrevPage={() => setNewsletterPage((p) => Math.max(1, p - 1))}
            onNextPage={() => setNewsletterPage((p) => p + 1)}
            onToggleStatus={handleToggleNewsletterStatus}
            onDelete={handleDeleteNewsletterSubscriber}
            sendType={newsletterSendType}
            onSendTypeChange={setNewsletterSendType}
            onPreview={handlePreviewNewsletter}
            previewLoading={newsletterPreviewLoading}
            previewData={newsletterPreviewData}
            onClosePreview={() => setNewsletterPreviewData(null)}
            onSend={handleSendNewsletter}
            sending={newsletterSending}
            forceResend={newsletterForceResend}
            onForceResendChange={setNewsletterForceResend}
            lastSendResult={newsletterLastSendResult}
            campaigns={newsletterCampaigns}
          />
        );
      case 'promotions':
        return (
          <PromotionsView
            promotions={promotions} loading={loading}
            onAdd={() => { setEditingPromotion(null); setPromotionForm(EMPTY_PROMOTION_FORM); setIsPromotionDialogOpen(true); }}
            onEdit={(promo) => {
              setEditingPromotion(promo);
              const toLocalInput = (d) => d ? new Date(d).toISOString().slice(0, 16) : '';
              setPromotionForm({
                title: promo.title || '', description: promo.description || '', bannerImage: promo.bannerImage || '',
                eventDate: toLocalInput(promo.eventDate), startDate: toLocalInput(promo.startDate), endDate: toLocalInput(promo.endDate),
                status: promo.status || 'active', priority: promo.priority || 0, buttonText: promo.buttonText || 'Read More',
                linkType: promo.linkType || 'none', linkValue: promo.linkValue || '', category: promo.category || '',
                isFeatured: promo.isFeatured || false, showCountdown: promo.showCountdown || false,
              });
              setIsPromotionDialogOpen(true);
            }}
            onDelete={handleDeletePromotion}
            onToggleStatus={handleTogglePromotionStatus}
          />
        );
      case 'reels':
        return (
          <ReelsView
            reels={reels} currentUser={currentUser} loading={loading}
            statusFilter={reelsStatusFilter} onStatusFilterChange={setReelsStatusFilter}
            categoryFilter={reelsCategoryFilter} onCategoryFilterChange={setReelsCategoryFilter}
            categories={categories}
            searchQuery={searchQuery}
            onAddNew={() => { setEditingReel(null); setReelForm({ ...EMPTY_REEL_FORM, reporterId: currentUser?.id || '' }); setIsReelDialogOpen(true); }}
            onEdit={(reel) => {
              setEditingReel(reel);
              const toLocalInput = (d) => d ? new Date(d).toISOString().slice(0, 16) : '';
              setReelForm({
                title: reel.title || '', description: reel.description || '', video: reel.video || null,
                thumbnailUrl: reel.thumbnail?.url || '', category: reel.category || '',
                tags: Array.isArray(reel.tags) ? reel.tags.join(', ') : '',
                language: reel.language || 'en', location: reel.location || EMPTY_LOCATION_FORM,
                linkedArticleId: reel.linkedArticleId || null, linkedArticleTitle: reel.linkedArticle?.title || '',
                reporterId: reel.reporterId || '', status: reel.status || 'draft',
                scheduledAt: toLocalInput(reel.scheduledAt), isFeatured: reel.isFeatured || false,
                isSensitive: reel.isSensitive || false,
              });
              setIsReelDialogOpen(true);
            }}
            onDelete={handleDeleteReel}
            onToggleStatus={handleToggleReelStatus}
            onResolveReport={handleResolveReelReport}
          />
        );
      case 'reporter-metrics':
        return (
          <ReporterMetricsView
            metrics={reporterMetrics}
            loading={loading}
            onSelectReporter={fetchReporterDetail}
          />
        );
      case 'livestream':
        return <LiveStreamView ytForm={ytForm} setYtForm={setYtForm} onSave={saveYtConfig} onClear={clearYtConfig} ytSaving={ytSaving} />;
      default:
        return null;
    }
  };

  const handleTabChange = (id) => {
    if (id === 'calendar') { router.push('/admin/editorial-calendar'); return; }
    setActiveTab(id);
    router.replace(`/admin?tab=${id}`, { scroll: false });
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'DM Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>
      <Sidebar
        activeTab={activeTab} onTabChange={handleTabChange}
        currentUser={currentUser} isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)} isMobile={isMobile}
      />

      <div style={DS.main(!isMobile)}>
        <Header
          currentUser={currentUser} onLogout={handleLogout}
          searchQuery={searchQuery}
          onSearchChange={(q) => { setSearchQuery(q); if (activeTab !== 'news') handleTabChange('news'); }}
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

      <PromotionFormDialog
        open={isPromotionDialogOpen} onOpenChange={setIsPromotionDialogOpen}
        editingPromotion={editingPromotion}
        promotionForm={promotionForm} setPromotionForm={setPromotionForm}
        categories={categories}
        articles={promotionArticleOptions}
        onSave={handleSavePromotion}
      />

      <ReelFormDialog
        open={isReelDialogOpen} onOpenChange={setIsReelDialogOpen}
        editingReel={editingReel}
        reelForm={reelForm} setReelForm={setReelForm}
        categories={categories} staffUsers={users} currentUser={currentUser}
        onSave={handleSaveReel}
      />

      <UserFormDialog
        open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}
        editingUser={editingUser}
        userForm={userForm} setUserForm={setUserForm}
        onSave={handleSaveUser}
      />

      <CommentDetailsDialog
        open={commentDialogOpen}
        comment={selectedComment}
        loading={commentLoading}
        onClose={() => setCommentDialogOpen(false)}
        onApprove={(comment)=> moderateComment(comment, 'approve')}
        onReject={(comment)=> moderateComment(comment, 'reject')}
        onHide={(comment)=> moderateComment(comment, 'hide')}
        onDelete={ deleteComment}
      />

      <VersionHistoryDialog
        open={isVersionHistoryOpen} onOpenChange={setIsVersionHistoryOpen}
        versionHistory={versionHistory} formatDate={formatDate}
      />

      <ReporterDetailDialog
        open={reporterDetailOpen}
        reporter={reporterDetail}
        loading={reporterDetailLoading}
        onClose={() => setReporterDetailOpen(false)}
        isMobile={isMobile}
      />
    </div>
  );
}
