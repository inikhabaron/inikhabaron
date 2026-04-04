'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import {
  Plus,
  Edit,
  Trash2,
  Check,
  X,
  Eye,
  Clock,
  FileText,
  Users,
  BarChart3,
  Settings,
  Newspaper,
  Home,
  Send,
  AlertCircle,
  Tag,
  Image as ImageIcon,
  Loader2,
  ChevronRight,
  CheckCircle,
  XCircle,
  History,
  TrendingUp,
  Share2,
  Upload,
  LogOut,
} from 'lucide-react';

// Status badge colors
const statusColors = {
  draft: 'bg-gray-500',
  pending_review: 'bg-yellow-500',
  needs_revision: 'bg-orange-500',
  ready_to_publish: 'bg-blue-500',
  published: 'bg-green-500',
  scheduled: 'bg-blue-500',
  rejected: 'bg-red-500',
};

const statusOptionsByRole = {
  reporter: [
    { value: 'draft', label: 'Draft' },
  ],
  editor: [
    { value: 'draft', label: 'Draft' },
    { value: 'pending_review', label: 'Pending Review' },
    { value: 'needs_revision', label: 'Needs Revision' },
  ],
  admin: [
    { value: 'draft', label: 'Draft' },
    { value: 'pending_review', label: 'Pending Review' },
    { value: 'needs_revision', label: 'Needs Revision' },
    { value: 'ready_to_publish', label: 'Ready to Publish' },
    { value: 'published', label: 'Published' },
    { value: 'scheduled', label: 'Scheduled' },
  ],
};

const statusFilterOptionsByRole = {
  reporter: [
    { value: 'all', label: 'All' },
    { value: 'draft', label: 'Draft' },
    { value: 'pending_review', label: 'Pending Review' },
    { value: 'needs_revision', label: 'Needs Revision' },
  ],
  editor: [
    { value: 'all', label: 'All' },
    { value: 'draft', label: 'Draft' },
    { value: 'pending_review', label: 'Pending Review' },
    { value: 'needs_revision', label: 'Needs Revision' },
  ],
  admin: [
    { value: 'all', label: 'All' },
    { value: 'draft', label: 'Draft' },
    { value: 'pending_review', label: 'Pending Review' },
    { value: 'needs_revision', label: 'Needs Revision' },
    { value: 'ready_to_publish', label: 'Ready to Publish' },
    { value: 'published', label: 'Published' },
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'rejected', label: 'Rejected' },
  ],
};

// Image Upload Component
const ImageUpload = ({ value, onChange, folder = 'news' }) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size must be less than 10MB');
      return;
    }
    
    setUploading(true);
    setProgress(10);
    
    try {
      // Get signature from backend
      const sigRes = await fetch(`/api/cloudinary/signature?folder=${folder}`);
      if (!sigRes.ok) {
        const errorData = await sigRes.text();
        throw new Error(`Signature request failed: ${sigRes.status} ${sigRes.statusText} ${errorData}`);
      }
      const sigData = await sigRes.json();
      
      if (sigData.error || !sigData.cloudName || !sigData.apiKey || sigData.cloudName.startsWith('TODO') || sigData.apiKey.startsWith('TODO')) {
        throw new Error('Cloudinary is not configured correctly. Please set CLOUDINARY_CLOUD_NAME and CLOUDINARY_API_KEY in .env');
      }
      
      setProgress(30);
      
      // Upload to Cloudinary
      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', sigData.apiKey);
      formData.append('timestamp', sigData.timestamp);
      formData.append('signature', sigData.signature);
      formData.append('folder', sigData.folder);
      formData.append('resource_type', sigData.resourceType || 'image');
      
      setProgress(50);
      
      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${sigData.cloudName}/image/upload`,
        { method: 'POST', body: formData }
      );
      
      setProgress(80);
      
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) {
        throw new Error(uploadData.error?.message || 'Cloudinary upload failed');
      }
      
      if (uploadData.secure_url) {
        onChange(uploadData.secure_url);
        toast.success('Image uploaded successfully!');
      } else {
        throw new Error(uploadData.error?.message || 'Upload failed');
      }
      
      setProgress(100);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image: ' + error.message);
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };
  
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={uploading}
          className="flex-1"
        />
        {uploading && (
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm text-muted-foreground">{progress}%</span>
          </div>
        )}
      </div>
      
      {value && (
        <div className="relative w-full h-40 rounded-lg overflow-hidden border">
          <img
            src={value}
            alt="Preview"
            className="w-full h-full object-cover"
          />
          <Button
            size="icon"
            variant="destructive"
            className="absolute top-2 right-2 h-6 w-6"
            onClick={() => onChange('')}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}
      
      <Input
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Or paste image URL directly"
        className="text-xs"
      />
    </div>
  );
};

export default function AdminPage() {
  // State
  const [activeTab, setActiveTab] = useState('dashboard');
  const [news, setNews] = useState([]);
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newsStatusFilter, setNewsStatusFilter] = useState('all');
  const [currentUser, setCurrentUser] = useState(null);
  
  // Edit states
  const [editingNews, setEditingNews] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [isNewsDialogOpen, setIsNewsDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false);
  const [versionHistory, setVersionHistory] = useState([]);
  
  // Form states
  const [newsForm, setNewsForm] = useState({
    title: '',
    content: '',
    excerpt: '',
    category: '',
    tags: '',
    featuredImage: '',
    status: 'draft',
    isBreaking: false,
    breakingSuggested: false,
    isTrending: false,
    trendingSuggested: false,
    isFeatured: false,
    authorName: 'Admin',
    source: '',
    sourceUrl: '',
    seoTitle: '',
    seoDescription: '',
    seoKeywords: '',
    scheduledAt: '',
  });
  
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    slug: '',
    description: '',
    color: '#3B82F6',
    order: 0,
    isActive: true,
  });

  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    role: 'reporter',
    isVerified: false,
    bio: '',
    canPublishScheduled: false,
    canPublishBreaking: false,
  });

  const [ytForm, setYtForm] = useState({ videoId: '', channelId: '', title: '', isLive: false });
  const [ytSaving, setYtSaving] = useState(false);

  // Helper function for authenticated requests
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
    const headers = {
      ...getAuthHeaders(),
      ...(options.headers || {}),
    };
    return fetch(authUrl, { ...options, headers });
  };

  // Fetch functions
  useEffect(() => {
    // Check if user is authenticated as admin
    const checkAdminAuth = () => {
      const adminToken = localStorage.getItem('admin_token');
      const adminSession = localStorage.getItem('admin_session');

      if (!adminToken || !adminSession) {
        // Redirect to login if not authenticated
        window.location.href = '/admin/login';
        return;
      }

      try {
        const session = JSON.parse(adminSession);
        // Optionally verify session expiry or role here
        if (!session || !session.role) {
          localStorage.removeItem('admin_token');
          localStorage.removeItem('admin_session');
          window.location.href = '/admin/login';
        }
        setCurrentUser({
          ...session,
          role: session.role?.toString().trim().toLowerCase(),
        });
      } catch (error) {
        console.error('Invalid session data:', error);
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_session');
        window.location.href = '/admin/login';
      }
    };

    checkAdminAuth();
  }, []);

  const fetchNews = useCallback(async () => {
    try {
      let url = '/api/admin/news?limit=100';
      if (newsStatusFilter !== 'all') {
        url += `&status=${newsStatusFilter}`;
      }
      
      // Add role-based filtering
      if (currentUser?.role === 'reporter') {
        url += `&authorId=${currentUser.id}`;
      } else if (currentUser?.role === 'editor') {
        // Editors see articles in their workflow states
        url += '&workflow=editor';
      }
      // Admins see all articles (no additional filtering)
      
      const res = await authFetch(url, {
        method: 'GET',
      });
      const data = await res.json();
      setNews(data.news || []);
    } catch (error) {
      console.error('Error fetching news:', error);
      toast.error('Failed to fetch news');
    }
  }, [newsStatusFilter, currentUser]);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await authFetch('/api/admin/categories', {
        method: 'GET',
      });
      const data = await res.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await authFetch('/api/admin/users', {
        method: 'GET',
      });
      const data = await res.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  }, []);

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await authFetch('/api/admin/analytics', {
        method: 'GET',
      });
      const data = await res.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  }, []);

  const fetchYtConfig = useCallback(async () => {
    try {
      const res = await authFetch('/api/admin/youtube-config', {
        method: 'GET',
      });
      const data = await res.json();
      if (data.config) {
        setYtForm({
          videoId: data.config.videoId || '',
          channelId: data.config.channelId || '',
          title: data.config.title || '',
          isLive: data.config.isLive || false,
        });
      }
    } catch (error) {
      console.error('Error fetching YouTube config:', error);
    }
  }, []);

  const saveYtConfig = async () => {
    setYtSaving(true);
    try {
      const res = await authFetch('/api/admin/youtube-config', {
        method: 'POST',
        body: JSON.stringify(ytForm),
      });
      if (res.ok) toast.success('Live stream config saved');
      else toast.error('Failed to save config');
    } catch {
      toast.error('Failed to save config');
    } finally {
      setYtSaving(false);
    }
  };

  const clearYtConfig = async () => {
    setYtForm({ videoId: '', channelId: '', title: '', isLive: false });
    setYtSaving(true);
    try {
      await authFetch('/api/admin/youtube-config', {
        method: 'POST',
        body: JSON.stringify({ videoId: '', channelId: '', title: '', isLive: false }),
      });
      toast.success('Live stream cleared');
    } catch {
      toast.error('Failed to clear config');
    } finally {
      setYtSaving(false);
    }
  };

  // Initial load and tab changes
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchCategories()]);
      
      if (activeTab === 'dashboard') {
        await fetchAnalytics();
      } else if (activeTab === 'news') {
        await fetchNews();
      } else if (activeTab === 'users' && currentUser?.role === 'admin') {
        await fetchUsers();
      } else if (activeTab === 'livestream') {
        await fetchYtConfig();
      }

      setLoading(false);
    };
    load();
  }, [activeTab, fetchCategories, fetchAnalytics, fetchNews, fetchUsers, fetchYtConfig, currentUser]);

  // Refetch news when filter changes
  useEffect(() => {
    if (activeTab === 'news') {
      fetchNews();
    }
  }, [newsStatusFilter, activeTab, fetchNews]);

  // News CRUD
  const handleSaveNews = async () => {
    try {
      const payload = {
        ...newsForm,
        tags: newsForm.tags.split(',').map(t => t.trim()).filter(Boolean),
        seoKeywords: newsForm.seoKeywords.split(',').map(t => t.trim()).filter(Boolean),
        authorId: currentUser?.id || 'admin',
        authorName: currentUser?.name || newsForm.authorName,
        status: editingNews ? newsForm.status : 'draft', // New articles start as draft
      };

      const method = editingNews ? 'PUT' : 'POST';
      const url = editingNews ? `/api/admin/news/${editingNews.id}` : '/api/admin/news';

      const res = await authFetch(url, {
        method,
        body: JSON.stringify(payload),
      });

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
      await authFetch(`/api/admin/news/${id}`, { 
        method: 'DELETE',
      });
      toast.success('News deleted');
      fetchNews();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const handleViewVersionHistory = async (articleId) => {
    try {
      const res = await authFetch(`/api/admin/news/${articleId}/versions`, {
        method: 'GET',
      });
      const data = await res.json();
      setVersionHistory(data.versions || []);
      setIsVersionHistoryOpen(true);
    } catch (error) {
      toast.error('Failed to load version history');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_session');
    window.location.href = '/admin/login';
  };

  const handleWorkflowAction = async (id, action, comment = '') => {
    try {
      const endpoint = `/api/admin/news/${id}/${action}`;
      const payload = comment ? { comment, userId: currentUser?.id, userName: currentUser?.name } : { userId: currentUser?.id, userName: currentUser?.name };

      const res = await authFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed to perform action');

      toast.success(`Article ${action.replace('_', ' ')}d successfully`);
      fetchNews();
      fetchAnalytics();
    } catch (error) {
      toast.error(`Failed to ${action.replace('_', ' ')} article`);
    }
  };

  const handleApproveNews = async (id) => {
    await handleWorkflowAction(id, 'approve');
  };

  const handleRejectNews = async (id, comment) => {
    await handleWorkflowAction(id, 'revise', comment || 'Needs revision');
  };

  const resetNewsForm = () => {
    setNewsForm({
      title: '',
      content: '',
      excerpt: '',
      category: '',
      tags: '',
      featuredImage: '',
      status: 'draft',
      isBreaking: false,
      breakingSuggested: false,
      isTrending: false,
      trendingSuggested: false,
      isFeatured: false,
      authorName: currentUser?.name || 'Admin',
      source: '',
      sourceUrl: '',
      seoTitle: '',
      seoDescription: '',
      seoKeywords: '',
      scheduledAt: '',
    });
    setEditingNews(null);
  };

  const openEditNews = (item) => {
    setEditingNews(item);
    setNewsForm({
      title: item.title || '',
      content: item.content || '',
      excerpt: item.excerpt || '',
      category: item.category || '',
      tags: item.tags?.join(', ') || '',
      featuredImage: item.featuredImage || '',
      status: item.status || 'draft',
      isBreaking: item.isBreaking || false,
      breakingSuggested: item.breakingSuggested || false,
      isTrending: item.isTrending || false,
      trendingSuggested: item.trendingSuggested || false,
      isFeatured: item.isFeatured || false,
      authorName: item.authorName || 'Admin',
      source: item.source || '',
      sourceUrl: item.sourceUrl || '',
      seoTitle: item.seoTitle || '',
      seoDescription: item.seoDescription || '',
      seoKeywords: item.seoKeywords?.join(', ') || '',
      scheduledAt: item.scheduledAt ? new Date(item.scheduledAt).toISOString().slice(0, 16) : '',
    });
    setIsNewsDialogOpen(true);
  };

  // Category CRUD
  const handleSaveCategory = async () => {
    try {
      const method = editingCategory ? 'PUT' : 'POST';
      const url = editingCategory ? `/api/admin/categories/${editingCategory.id}` : '/api/admin/categories';

      const res = await authFetch(url, {
        method,
        body: JSON.stringify(categoryForm),
      });

      if (!res.ok) throw new Error('Failed to save');

      toast.success(editingCategory ? 'Category updated' : 'Category created');
      setIsCategoryDialogOpen(false);
      setCategoryForm({ name: '', slug: '', description: '', color: '#3B82F6', order: 0, isActive: true });
      setEditingCategory(null);
      fetchCategories();
    } catch (error) {
      toast.error('Failed to save category');
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!confirm('Are you sure?')) return;
    
    try {
      await authFetch(`/api/admin/categories/${id}`, { 
        method: 'DELETE',
      });
      toast.success('Category deleted');
      fetchCategories();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  // User CRUD
  const handleSaveUser = async () => {
    try {
      const method = editingUser ? 'PUT' : 'POST';
      const url = editingUser ? `/api/admin/users/${editingUser.id}` : '/api/admin/users';

      const res = await authFetch(url, {
        method,
        body: JSON.stringify(userForm),
      });

      if (!res.ok) throw new Error('Failed to save');

      toast.success(editingUser ? 'User updated' : 'User created');
      setIsUserDialogOpen(false);
      setUserForm({ name: '', email: '', role: 'reporter', isVerified: false, bio: '', canPublishScheduled: false, canPublishBreaking: false });
      setEditingUser(null);
      fetchUsers();
    } catch (error) {
      toast.error('Failed to save user');
    }
  };

  const handleDeleteUser = async (id) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    
    try {
      await authFetch(`/api/admin/users/${id}`, { 
        method: 'DELETE',
      });
      toast.success('User deleted');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-primary text-primary-foreground border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Newspaper className="h-8 w-8" />
              <span className="text-xl font-bold">NewsDesk Admin</span>
            </div>
            <div className="flex items-center gap-4">
              <a href="/" className="flex items-center gap-2 hover:opacity-80">
                <Home className="h-4 w-4" />
                <span className="hidden sm:inline">View Site</span>
              </a>
              <Badge variant="secondary" className="capitalize">
                {currentUser?.role || 'Admin'}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-primary-foreground hover:bg-primary-foreground/10"
              >
                <LogOut className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="news" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              News
            </TabsTrigger>
            {currentUser?.role === 'admin' && (
              <>
                <TabsTrigger value="categories" className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Categories
                </TabsTrigger>
                <TabsTrigger value="users" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Users
                </TabsTrigger>
              </>
            )}
            <TabsTrigger value="livestream" className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              Live Stream
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : analytics ? (
              <div className="space-y-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Total Articles</p>
                          <p className="text-3xl font-bold">{analytics.stats?.totalNews || 0}</p>
                        </div>
                        <FileText className="h-10 w-10 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Published</p>
                          <p className="text-3xl font-bold text-green-600">{analytics.stats?.publishedNews || 0}</p>
                        </div>
                        <CheckCircle className="h-10 w-10 text-green-600" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Pending Review</p>
                          <p className="text-3xl font-bold text-yellow-600">{analytics.stats?.pendingReviewNews || 0}</p>
                        </div>
                        <Clock className="h-10 w-10 text-yellow-600" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Total Views</p>
                          <p className="text-3xl font-bold text-blue-600">
                            {analytics.stats?.totalViews?.toLocaleString() || 0}
                          </p>
                        </div>
                        <Eye className="h-10 w-10 text-blue-600" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Top Articles */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Top Performing Articles
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead className="text-right">Views</TableHead>
                          <TableHead className="text-right">Shares</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {analytics.topArticles?.map((article) => (
                          <TableRow key={article.id}>
                            <TableCell className="font-medium max-w-md truncate">
                              {article.title}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{article.category}</Badge>
                            </TableCell>
                            <TableCell className="text-right">{article.views?.toLocaleString() || 0}</TableCell>
                            <TableCell className="text-right">
                              {(article.shares?.whatsapp || 0) + (article.shares?.twitter || 0) + (article.shares?.facebook || 0)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-3">
                    {(currentUser?.role === 'admin' || currentUser?.role === 'editor' || currentUser?.role === 'reporter') && (
                      <Button onClick={() => { resetNewsForm(); setIsNewsDialogOpen(true); }}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Article
                      </Button>
                    )}
                    <Button variant="outline" onClick={() => setActiveTab('news')}>
                      <FileText className="h-4 w-4 mr-2" />
                      Manage News
                    </Button>
                    {currentUser?.role === 'admin' && (
                      <>
                        <Button variant="outline" onClick={() => setActiveTab('categories')}>
                          <Tag className="h-4 w-4 mr-2" />
                          Manage Categories
                        </Button>
                        <Button variant="outline" onClick={() => setActiveTab('users')}>
                          <Users className="h-4 w-4 mr-2" />
                          Manage Users
                        </Button>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : null}
          </TabsContent>

          {/* News Tab */}
          <TabsContent value="news">
            <div className="space-y-4">
              {/* Actions Bar */}
              <div className="flex flex-col sm:flex-row gap-4 justify-between">
                <div className="flex items-center gap-2">
                  <Label>Status:</Label>
                  <Select value={newsStatusFilter} onValueChange={setNewsStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                    {(statusFilterOptionsByRole[currentUser?.role] || statusFilterOptionsByRole.admin).map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                  </Select>
                </div>
                <Button onClick={() => { resetNewsForm(); setIsNewsDialogOpen(true); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Article
                </Button>
              </div>

              {/* News Table */}
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Author</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {news.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="max-w-xs">
                            <div className="flex items-center gap-2 flex-wrap">
                              {item.isBreaking && <Badge className="bg-red-500 text-white">Breaking</Badge>}
                              {item.breakingSuggested && !item.breakingApproved && <Badge className="bg-orange-500 text-white">Breaking Suggested</Badge>}
                              {item.isTrending && <Badge className="bg-blue-500 text-white">Trending</Badge>}
                              {item.trendingSuggested && !item.isTrending && <Badge className="bg-purple-500 text-white">Trending Suggested</Badge>}
                              <span className="truncate">{item.title}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{item.category}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={`${statusColors[item.status]} text-white`}>
                              {item.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </Badge>
                          </TableCell>
                          <TableCell>{item.authorName || '-'}</TableCell>
                          <TableCell className="text-sm">{formatDate(item.createdAt)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              {/* Workflow Actions based on role and status */}
                              {currentUser?.role === 'reporter' && item.status === 'draft' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-blue-600 hover:text-blue-700"
                                  onClick={() => handleWorkflowAction(item.id, 'submit')}
                                  title="Submit for Review"
                                >
                                  <Send className="h-4 w-4 mr-1" />
                                  Submit
                                </Button>
                              )}
                              
                              {currentUser?.role === 'editor' && item.status === 'pending_review' && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-green-600 hover:text-green-700"
                                    onClick={() => handleWorkflowAction(item.id, 'approve')}
                                    title="Approve Article"
                                  >
                                    <Check className="h-4 w-4 mr-1" />
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-orange-600 hover:text-orange-700"
                                    onClick={() => handleWorkflowAction(item.id, 'revise')}
                                    title="Send Back for Revision"
                                  >
                                    <X className="h-4 w-4 mr-1" />
                                    Revise
                                  </Button>
                                </>
                              )}
                              
                              {currentUser?.role === 'reporter' && item.status === 'needs_revision' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-blue-600 hover:text-blue-700"
                                  onClick={() => handleWorkflowAction(item.id, 'submit')}
                                  title="Resubmit for Review"
                                >
                                  <Send className="h-4 w-4 mr-1" />
                                  Resubmit
                                </Button>
                              )}
                              
                              {currentUser?.role === 'admin' && item.status === 'ready_to_publish' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-green-600 hover:text-green-700"
                                  onClick={() => handleWorkflowAction(item.id, 'publish')}
                                  title="Publish Article"
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Publish
                                </Button>
                              )}
                              
                              {currentUser?.role === 'admin' && item.breakingSuggested && !item.breakingApproved && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 hover:text-red-700"
                                  onClick={() => handleWorkflowAction(item.id, 'approve-breaking')}
                                  title="Approve Breaking News"
                                >
                                  <AlertCircle className="h-4 w-4 mr-1" />
                                  Approve Breaking
                                </Button>
                              )}
                              
                              {(currentUser?.role === 'admin' || currentUser?.role === 'editor') && item.trendingSuggested && !item.isTrending && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-purple-600 hover:text-purple-700"
                                  onClick={() => handleWorkflowAction(item.id, 'approve-trending')}
                                  title="Approve Trending"
                                >
                                  <TrendingUp className="h-4 w-4 mr-1" />
                                  Approve Trending
                                </Button>
                              )}

                              {/* Edit button - available based on permissions */}
                              {((currentUser?.role === 'admin') ||
                                (currentUser?.role === 'editor' && ['draft', 'needs_revision'].includes(item.status)) ||
                                (currentUser?.role === 'reporter' && item.status === 'draft' && item.authorId === currentUser?.id)) && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => openEditNews(item)}
                                  title="Edit"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              )}

                              {/* Version History button */}
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleViewVersionHistory(item.id)}
                                title="Version History"
                              >
                                <History className="h-4 w-4" />
                              </Button>

                              {/* Delete button - admin only */}
                              {currentUser?.role === 'admin' && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="text-red-600 hover:text-red-700"
                                  onClick={() => handleDeleteNews(item.id)}
                                  title="Delete"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {news.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            No articles found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories">
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button onClick={() => {
                  setEditingCategory(null);
                  setCategoryForm({ name: '', slug: '', description: '', color: '#3B82F6', order: 0, isActive: true });
                  setIsCategoryDialogOpen(true);
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Category
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map((cat) => (
                  <Card key={cat.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: cat.color }}
                          />
                          <span className="font-semibold">{cat.name}</span>
                        </div>
                        <Badge variant={cat.isActive ? 'default' : 'secondary'}>
                          {cat.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {cat.description || 'No description'}
                      </p>
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingCategory(cat);
                            setCategoryForm({
                              name: cat.name,
                              slug: cat.slug,
                              description: cat.description || '',
                              color: cat.color,
                              order: cat.order,
                              isActive: cat.isActive,
                            });
                            setIsCategoryDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600"
                          onClick={() => handleDeleteCategory(cat.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button onClick={() => {
                  setEditingUser(null);
                  setUserForm({ name: '', email: '', role: 'reporter', isVerified: false, bio: '', canPublishScheduled: false, canPublishBreaking: false });
                  setIsUserDialogOpen(true);
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              </div>

              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Verified</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.name}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">{user.role}</Badge>
                          </TableCell>
                          <TableCell>
                            {user.isVerified ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <XCircle className="h-4 w-4 text-muted-foreground" />
                            )}
                          </TableCell>
                          <TableCell className="text-sm">{formatDate(user.createdAt)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => {
                                  setEditingUser(user);
                                  setUserForm({
                                    name: user.name,
                                    email: user.email || '',
                                    role: user.role,
                                    isVerified: user.isVerified,
                                    bio: user.bio || '',
                                    canPublishScheduled: user.permissions?.canPublishScheduled || false,
                                    canPublishBreaking: user.permissions?.canPublishBreaking || false,
                                  });
                                  setIsUserDialogOpen(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="text-red-600 hover:text-red-700"
                                onClick={() => handleDeleteUser(user.id)}
                                title="Delete User"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {users.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            No users found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Live Stream Tab */}
          <TabsContent value="livestream">
            <div className="max-w-2xl space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Live Stream Settings</CardTitle>
                  <CardDescription>
                    Paste any YouTube video ID to embed it as a live stream on the homepage. Overrides automatic channel detection.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>YouTube Video ID <span className="text-red-500">*</span></Label>
                    <Input
                      placeholder="e.g. dQw4w9WgXcQ"
                      value={ytForm.videoId}
                      onChange={(e) => setYtForm({ ...ytForm, videoId: e.target.value.trim() })}
                    />
                    <p className="text-xs text-muted-foreground">
                      From any YouTube URL: youtube.com/watch?v=<strong>THIS_PART</strong> or youtu.be/<strong>THIS_PART</strong>
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Display Title <span className="text-muted-foreground text-xs">(optional)</span></Label>
                    <Input
                      placeholder="e.g. BBC News Live"
                      value={ytForm.title}
                      onChange={(e) => setYtForm({ ...ytForm, title: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">Shown in the banner on the homepage. Leave blank to use YouTube's video title.</p>
                  </div>

                  <div className="flex items-center gap-3 py-2">
                    <Switch
                      checked={ytForm.isLive}
                      onCheckedChange={(v) => setYtForm({ ...ytForm, isLive: v })}
                    />
                    <div>
                      <Label>Mark as Live</Label>
                      <p className="text-xs text-muted-foreground">Shows the red pulsing LIVE badge on the banner</p>
                    </div>
                  </div>

                  {ytForm.videoId && (
                    <div className="rounded-lg overflow-hidden border">
                      <p className="text-xs text-muted-foreground px-3 py-2 bg-muted">Preview</p>
                      <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                        <iframe
                          className="absolute inset-0 w-full h-full"
                          src={`https://www.youtube.com/embed/${ytForm.videoId}?rel=0`}
                          title="Preview"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <Button onClick={saveYtConfig} disabled={ytSaving || !ytForm.videoId}>
                      {ytSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                      Save & Go Live
                    </Button>
                    <Button variant="outline" onClick={clearYtConfig} disabled={ytSaving}>
                      Clear / Go Offline
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Fallback — Channel Auto-Detection</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-1">
                  <p>When no Video ID is set above, the system falls back to:</p>
                  <ol className="list-decimal list-inside space-y-1 mt-2">
                    <li>Check if your configured channel is live (requires YouTube API key)</li>
                    <li>Embed latest uploaded video from the channel</li>
                    <li>Open YouTube channel page in a new tab (if no API key)</li>
                  </ol>
                  <p className="mt-3">Configure <code className="bg-muted px-1 rounded">YOUTUBE_CHANNEL_ID</code> and optionally <code className="bg-muted px-1 rounded">YOUTUBE_API_KEY</code> in your <code className="bg-muted px-1 rounded">.env</code> file for auto-detection.</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

        </Tabs>
      </div>

      {/* News Dialog */}
      <Dialog open={isNewsDialogOpen} onOpenChange={setIsNewsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingNews ? 'Edit Article' : 'Create Article'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input
                  value={newsForm.title}
                  onChange={(e) => setNewsForm({ ...newsForm, title: e.target.value })}
                  placeholder="Article title"
                />
              </div>
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select
                  value={newsForm.category}
                  onValueChange={(v) => setNewsForm({ ...newsForm, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.slug}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Content *</Label>
              <Textarea
                value={newsForm.content}
                onChange={(e) => setNewsForm({ ...newsForm, content: e.target.value })}
                placeholder="Article content..."
                rows={8}
              />
            </div>

            <div className="space-y-2">
              <Label>Excerpt</Label>
              <Textarea
                value={newsForm.excerpt}
                onChange={(e) => setNewsForm({ ...newsForm, excerpt: e.target.value })}
                placeholder="Brief summary (auto-generated if empty)"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Featured Image</Label>
                <ImageUpload
                  value={newsForm.featuredImage}
                  onChange={(url) => setNewsForm({ ...newsForm, featuredImage: url })}
                  folder="news"
                />
              </div>
              <div className="space-y-2">
                <Label>Tags (comma separated)</Label>
                <Input
                  value={newsForm.tags}
                  onChange={(e) => setNewsForm({ ...newsForm, tags: e.target.value })}
                  placeholder="politics, breaking, economy"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={newsForm.status}
                  onValueChange={(v) => setNewsForm({ ...newsForm, status: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(statusOptionsByRole[currentUser?.role] || statusOptionsByRole.admin).map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Author Name</Label>
                <Input
                  value={newsForm.authorName}
                  onChange={(e) => setNewsForm({ ...newsForm, authorName: e.target.value })}
                />
              </div>
              {newsForm.status === 'scheduled' && (
                <div className="space-y-2">
                  <Label>Schedule Date</Label>
                  <Input
                    type="datetime-local"
                    value={newsForm.scheduledAt}
                    onChange={(e) => setNewsForm({ ...newsForm, scheduledAt: e.target.value })}
                  />
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-6">
              {currentUser?.role === 'admin' && (
                <div className="flex items-center gap-2">
                  <Switch
                    checked={newsForm.isBreaking}
                    onCheckedChange={(v) => setNewsForm({ ...newsForm, isBreaking: v })}
                  />
                  <Label>Breaking News</Label>
                </div>
              )}

              {(currentUser?.role === 'reporter' || currentUser?.role === 'editor') && (
                <div className="flex items-center gap-2">
                  <Switch
                    checked={newsForm.breakingSuggested}
                    onCheckedChange={(v) => setNewsForm({ ...newsForm, breakingSuggested: v })}
                  />
                  <Label>Suggest Breaking News</Label>
                </div>
              )}

              {currentUser?.role !== 'reporter' && (
                <div className="flex items-center gap-2">
                  <Switch
                    checked={newsForm.isTrending}
                    onCheckedChange={(v) => setNewsForm({ ...newsForm, isTrending: v })}
                  />
                  <Label>Trending</Label>
                </div>
              )}

              {currentUser?.role === 'reporter' && (
                <div className="flex items-center gap-2">
                  <Switch
                    checked={newsForm.trendingSuggested}
                    onCheckedChange={(v) => setNewsForm({ ...newsForm, trendingSuggested: v })}
                  />
                  <Label>Suggest Trending</Label>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Switch
                  checked={newsForm.isFeatured}
                  onCheckedChange={(v) => setNewsForm({ ...newsForm, isFeatured: v })}
                />
                <Label>Featured Article</Label>
              </div>
            </div>

            <Separator />

            <h4 className="font-semibold">Source Attribution</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Source Name</Label>
                <Input
                  value={newsForm.source}
                  onChange={(e) => setNewsForm({ ...newsForm, source: e.target.value })}
                  placeholder="Reuters, AP, etc."
                />
              </div>
              <div className="space-y-2">
                <Label>Source URL</Label>
                <Input
                  value={newsForm.sourceUrl}
                  onChange={(e) => setNewsForm({ ...newsForm, sourceUrl: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>

            <Separator />

            <h4 className="font-semibold">SEO Settings</h4>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>SEO Title</Label>
                <Input
                  value={newsForm.seoTitle}
                  onChange={(e) => setNewsForm({ ...newsForm, seoTitle: e.target.value })}
                  placeholder="SEO optimized title (defaults to article title)"
                />
              </div>
              <div className="space-y-2">
                <Label>SEO Description</Label>
                <Textarea
                  value={newsForm.seoDescription}
                  onChange={(e) => setNewsForm({ ...newsForm, seoDescription: e.target.value })}
                  placeholder="Meta description for search engines"
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>SEO Keywords (comma separated)</Label>
                <Input
                  value={newsForm.seoKeywords}
                  onChange={(e) => setNewsForm({ ...newsForm, seoKeywords: e.target.value })}
                  placeholder="keyword1, keyword2, keyword3"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveNews} disabled={!newsForm.title || !newsForm.content || !newsForm.category}>
              {editingNews ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Category Dialog */}
      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? 'Edit Category' : 'Create Category'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({
                  ...categoryForm,
                  name: e.target.value,
                  slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                })}
                placeholder="Category name"
              />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input
                value={categoryForm.slug}
                onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })}
                placeholder="category-slug"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={categoryForm.description}
                onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                placeholder="Category description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={categoryForm.color}
                    onChange={(e) => setCategoryForm({ ...categoryForm, color: e.target.value })}
                    className="w-12 h-10 p-1"
                  />
                  <Input
                    value={categoryForm.color}
                    onChange={(e) => setCategoryForm({ ...categoryForm, color: e.target.value })}
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Order</Label>
                <Input
                  type="number"
                  value={categoryForm.order}
                  onChange={(e) => setCategoryForm({ ...categoryForm, order: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={categoryForm.isActive}
                onCheckedChange={(v) => setCategoryForm({ ...categoryForm, isActive: v })}
              />
              <Label>Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCategoryDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveCategory} disabled={!categoryForm.name}>
              {editingCategory ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Version History Dialog */}
      <Dialog open={isVersionHistoryOpen} onOpenChange={setIsVersionHistoryOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Version History</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {versionHistory.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No version history available</p>
            ) : (
              <div className="space-y-4">
                {versionHistory.map((version, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <Badge variant="outline" className="mb-1">
                            Version {version.version || index + 1}
                          </Badge>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(version.timestamp)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{version.authorName || 'Unknown'}</p>
                          <Badge className={`${statusColors[version.status]} text-white text-xs`}>
                            {version.status?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </Badge>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-semibold">{version.title}</h4>
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {version.content}
                        </p>
                        {version.corrections && version.corrections.length > 0 && (
                          <div className="mt-2">
                            <p className="text-sm font-medium text-orange-600">Corrections:</p>
                            <ul className="text-sm text-muted-foreground ml-4">
                              {version.corrections.map((correction, idx) => (
                                <li key={idx} className="list-disc">{correction}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* User Dialog */}
      <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Edit User' : 'Create User'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={userForm.name}
                onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                placeholder="Full name"
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={userForm.email}
                onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                placeholder="email@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={userForm.role}
                onValueChange={(v) => setUserForm({ ...userForm, role: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reader">Reader</SelectItem>
                  <SelectItem value="reporter">Reporter</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Bio</Label>
              <Textarea
                value={userForm.bio}
                onChange={(e) => setUserForm({ ...userForm, bio: e.target.value })}
                placeholder="User bio"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={userForm.isVerified}
                onCheckedChange={(v) => setUserForm({ ...userForm, isVerified: v })}
              />
              <Label>Verified Author</Label>
            </div>
            {userForm.role === 'editor' && (
              <>
                <Separator />
                <h4 className="font-semibold">Editor Permissions</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={userForm.canPublishScheduled}
                      onCheckedChange={(v) => setUserForm({ ...userForm, canPublishScheduled: v })}
                    />
                    <Label>Can publish scheduled news</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={userForm.canPublishBreaking}
                      onCheckedChange={(v) => setUserForm({ ...userForm, canPublishBreaking: v })}
                    />
                    <Label>Can publish breaking news</Label>
                  </div>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUserDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveUser} disabled={!userForm.name}>
              {editingUser ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
