'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import {
  Search,
  Menu,
  X,
  Share2,
  Clock,
  Eye,
  ChevronRight,
  Newspaper,
  TrendingUp,
  Bell,
  User,
  LogOut,
  Bookmark,
  Home,
  Building,
  Trophy,
  Briefcase,
  Film,
  Laptop,
  MapPin,
  Flag,
  Globe,
  Phone,
  Mail,
  Loader2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

// Category icons mapping
const categoryIcons = {
  politics: Building,
  sports: Trophy,
  business: Briefcase,
  entertainment: Film,
  technology: Laptop,
  local: MapPin,
  national: Flag,
  world: Globe,
};

// Category colors mapping
const categoryColors = {
  politics: 'bg-red-600',
  sports: 'bg-green-600',
  business: 'bg-blue-600',
  entertainment: 'bg-purple-600',
  technology: 'bg-cyan-600',
  local: 'bg-yellow-600',
  national: 'bg-orange-600',
  world: 'bg-indigo-600',
};

export default function HomePage() {
  const [news, setNews] = useState([]);
  const [breakingNews, setBreakingNews] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNews, setSelectedNews] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }, []);

  // Fetch news
  const fetchNews = useCallback(async (category = 'all', search = '', pageNum = 1) => {
    try {
      setLoading(true);
      let url = `/api/news?page=${pageNum}&limit=12`;
      if (category && category !== 'all') url += `&category=${category}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      
      const res = await fetch(url);
      const data = await res.json();
      
      if (pageNum === 1) {
        setNews(data.news || []);
      } else {
        setNews(prev => [...prev, ...(data.news || [])]);
      }
      
      setHasMore(data.pagination?.page < data.pagination?.pages);
    } catch (error) {
      console.error('Error fetching news:', error);
      toast.error('Failed to load news');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch breaking news
  const fetchBreakingNews = useCallback(async () => {
    try {
      const res = await fetch('/api/news/breaking');
      const data = await res.json();
      setBreakingNews(data.news || []);
    } catch (error) {
      console.error('Error fetching breaking news:', error);
    }
  }, []);

  // Seed data on first load
  const seedData = useCallback(async () => {
    try {
      await fetch('/api/seed', { method: 'POST' });
    } catch (error) {
      console.error('Seed error:', error);
    }
  }, []);

  // Initial load
  useEffect(() => {
    const init = async () => {
      await seedData();
      await fetchCategories();
      await fetchBreakingNews();
      await fetchNews();
    };
    init();
  }, [seedData, fetchCategories, fetchBreakingNews, fetchNews]);

  // Handle category change
  useEffect(() => {
    setPage(1);
    fetchNews(selectedCategory, searchQuery, 1);
  }, [selectedCategory, fetchNews, searchQuery]);

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchNews(selectedCategory, searchQuery, 1);
  };

  // Load more
  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchNews(selectedCategory, searchQuery, nextPage);
  };

  // Track share
  const trackShare = async (newsId, platform) => {
    try {
      await fetch(`/api/news/${newsId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform }),
      });
    } catch (error) {
      console.error('Share tracking error:', error);
    }
  };

  // Share functions
  const shareOnWhatsApp = (newsItem) => {
    const url = `${window.location.origin}/news/${newsItem.id}`;
    const text = `${newsItem.title}\n\nRead more: ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    trackShare(newsItem.id, 'whatsapp');
    toast.success('Opening WhatsApp...');
  };

  const shareOnTwitter = (newsItem) => {
    const url = `${window.location.origin}/news/${newsItem.id}`;
    const text = newsItem.title;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
    trackShare(newsItem.id, 'twitter');
    toast.success('Opening Twitter...');
  };

  const shareOnFacebook = (newsItem) => {
    const url = `${window.location.origin}/news/${newsItem.id}`;
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
    trackShare(newsItem.id, 'facebook');
    toast.success('Opening Facebook...');
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 3600000) {
      const mins = Math.floor(diff / 60000);
      return `${mins} min${mins !== 1 ? 's' : ''} ago`;
    } else if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  };

  // Get category icon component
  const getCategoryIcon = (categorySlug) => {
    const IconComponent = categoryIcons[categorySlug] || Newspaper;
    return IconComponent;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <Newspaper className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold">NewsDesk</span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  selectedCategory === 'all' ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                All News
              </button>
              {categories.slice(0, 6).map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.slug)}
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    selectedCategory === cat.slug ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </nav>

            {/* Search & Actions */}
            <div className="flex items-center gap-3">
              <form onSubmit={handleSearch} className="hidden sm:flex items-center">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search news..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 w-48 lg:w-64"
                  />
                </div>
              </form>

              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {breakingNews.length > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">
                    {breakingNews.length}
                  </span>
                )}
              </Button>

              <Dialog open={authDialogOpen} onOpenChange={setAuthDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <User className="h-4 w-4 mr-2" />
                    Sign In
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Sign In to NewsDesk</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <p className="text-sm text-muted-foreground text-center">
                      Sign in to save articles, get personalized recommendations, and receive push notifications.
                    </p>
                    <div className="space-y-3">
                      <Button className="w-full" variant="outline" disabled>
                        <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                          <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        Continue with Google
                      </Button>
                      <Button className="w-full" variant="outline" disabled>
                        <Phone className="h-5 w-5 mr-2" />
                        Continue with Phone
                      </Button>
                      <Button className="w-full" variant="outline" disabled>
                        <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                        </svg>
                        Continue with Apple
                      </Button>
                    </div>
                    <p className="text-xs text-center text-muted-foreground">
                      TODO: Add Firebase credentials in .env to enable authentication
                    </p>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t">
              <form onSubmit={handleSearch} className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search news..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </form>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedCategory === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setSelectedCategory('all');
                    setMobileMenuOpen(false);
                  }}
                >
                  All
                </Button>
                {categories.map((cat) => (
                  <Button
                    key={cat.id}
                    variant={selectedCategory === cat.slug ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setSelectedCategory(cat.slug);
                      setMobileMenuOpen(false);
                    }}
                  >
                    {cat.name}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Breaking News Ticker */}
      {breakingNews.length > 0 && (
        <div className="bg-red-600 text-white py-2 overflow-hidden">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="bg-white text-red-600 shrink-0">
                <AlertCircle className="h-3 w-3 mr-1" />
                BREAKING
              </Badge>
              <div className="overflow-hidden">
                <div className="animate-marquee whitespace-nowrap">
                  {breakingNews.map((item, idx) => (
                    <span key={item.id} className="mx-8">
                      {item.title}
                      {idx < breakingNews.length - 1 && ' • '}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main News Feed */}
          <div className="lg:col-span-3">
            {/* Category Pills for Desktop */}
            <div className="hidden md:flex items-center gap-2 mb-6 overflow-x-auto pb-2">
              <Button
                variant={selectedCategory === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory('all')}
              >
                <Home className="h-4 w-4 mr-1" />
                All
              </Button>
              {categories.map((cat) => {
                const Icon = getCategoryIcon(cat.slug);
                return (
                  <Button
                    key={cat.id}
                    variant={selectedCategory === cat.slug ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory(cat.slug)}
                    style={selectedCategory === cat.slug ? { backgroundColor: cat.color } : {}}
                  >
                    <Icon className="h-4 w-4 mr-1" />
                    {cat.name}
                  </Button>
                );
              })}
            </div>

            {/* Featured News (first item larger) */}
            {news.length > 0 && !loading && (
              <Card className="mb-6 overflow-hidden group cursor-pointer" onClick={() => setSelectedNews(news[0])}>
                <div className="grid md:grid-cols-2 gap-0">
                  <div className="relative aspect-video md:aspect-auto">
                    <img
                      src={news[0].featuredImage || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800'}
                      alt={news[0].title}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                    {news[0].isBreaking && (
                      <Badge className="absolute top-4 left-4 bg-red-600">Breaking</Badge>
                    )}
                  </div>
                  <CardContent className="p-6 flex flex-col justify-center">
                    <Badge variant="outline" className={`w-fit mb-3 ${categoryColors[news[0].category]} text-white border-0`}>
                      {news[0].category}
                    </Badge>
                    <h2 className="text-2xl font-bold mb-3 group-hover:text-primary transition-colors">
                      {news[0].title}
                    </h2>
                    <p className="text-muted-foreground mb-4 line-clamp-3">
                      {news[0].excerpt}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {formatDate(news[0].publishedAt)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        {news[0].views?.toLocaleString() || 0} views
                      </span>
                    </div>
                  </CardContent>
                </div>
              </Card>
            )}

            {/* News Grid */}
            {loading && news.length === 0 ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {news.slice(1).map((item) => (
                    <Card
                      key={item.id}
                      className="overflow-hidden group cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => setSelectedNews(item)}
                    >
                      <div className="relative aspect-video">
                        <img
                          src={item.featuredImage || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800'}
                          alt={item.title}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        />
                        <Badge
                          className={`absolute top-3 left-3 ${categoryColors[item.category] || 'bg-gray-600'} text-white border-0`}
                        >
                          {item.category}
                        </Badge>
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                          {item.title}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {item.excerpt}
                        </p>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(item.publishedAt)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {item.views?.toLocaleString() || 0}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Load More */}
                {hasMore && (
                  <div className="flex justify-center mt-8">
                    <Button onClick={loadMore} disabled={loading} variant="outline">
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        <>
                          Load More
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {news.length === 0 && !loading && (
                  <div className="text-center py-20">
                    <Newspaper className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No news found</h3>
                    <p className="text-muted-foreground">
                      {searchQuery ? 'Try different search terms' : 'Check back later for updates'}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-1">
            {/* Trending */}
            <Card className="mb-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Trending Now
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {news.slice(0, 5).map((item, idx) => (
                  <div
                    key={item.id}
                    className="flex gap-3 cursor-pointer group"
                    onClick={() => setSelectedNews(item)}
                  >
                    <span className="text-2xl font-bold text-muted-foreground/50 w-6">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors">
                        {item.title}
                      </p>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(item.publishedAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Categories */}
            <Card className="mb-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Categories</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {categories.map((cat) => {
                  const Icon = getCategoryIcon(cat.slug);
                  return (
                    <Button
                      key={cat.id}
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => setSelectedCategory(cat.slug)}
                    >
                      <Icon className="h-4 w-4 mr-2" style={{ color: cat.color }} />
                      {cat.name}
                      <ChevronRight className="h-4 w-4 ml-auto" />
                    </Button>
                  );
                })}
              </CardContent>
            </Card>

            {/* Admin Link */}
            <Card>
              <CardContent className="p-4">
                <a
                  href="/admin"
                  className="flex items-center justify-center gap-2 text-primary hover:underline"
                >
                  <Building className="h-4 w-4" />
                  Admin Panel
                  <ExternalLink className="h-3 w-3" />
                </a>
              </CardContent>
            </Card>
          </aside>
        </div>
      </main>

      {/* News Detail Modal */}
      <Dialog open={!!selectedNews} onOpenChange={() => setSelectedNews(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedNews && (
            <>
              <div className="relative aspect-video -mx-6 -mt-6 mb-4">
                <img
                  src={selectedNews.featuredImage || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800'}
                  alt={selectedNews.title}
                  className="w-full h-full object-cover"
                />
                <Badge
                  className={`absolute top-4 left-4 ${categoryColors[selectedNews.category] || 'bg-gray-600'} text-white border-0`}
                >
                  {selectedNews.category}
                </Badge>
              </div>
              <DialogHeader>
                <DialogTitle className="text-2xl">{selectedNews.title}</DialogTitle>
              </DialogHeader>
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                <span className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {selectedNews.authorName || 'NewsDesk Team'}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {formatDate(selectedNews.publishedAt)}
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  {selectedNews.views?.toLocaleString() || 0} views
                </span>
              </div>

              {/* Source attribution */}
              {selectedNews.source && (
                <div className="text-sm text-muted-foreground mb-4">
                  Source: {selectedNews.sourceUrl ? (
                    <a href={selectedNews.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      {selectedNews.source}
                    </a>
                  ) : selectedNews.source}
                </div>
              )}

              {/* Tags */}
              {selectedNews.tags?.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {selectedNews.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              )}

              <Separator className="my-4" />

              {/* Content */}
              <div className="prose prose-sm max-w-none">
                <p className="whitespace-pre-wrap">{selectedNews.content}</p>
              </div>

              {/* Corrections */}
              {selectedNews.corrections?.length > 0 && (
                <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Corrections
                  </h4>
                  {selectedNews.corrections.map((correction) => (
                    <div key={correction.id} className="text-sm mb-2">
                      <span className="text-muted-foreground">
                        {formatDate(correction.at)}:
                      </span>{' '}
                      {correction.text}
                    </div>
                  ))}
                </div>
              )}

              <Separator className="my-4" />

              {/* Share buttons */}
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">Share:</span>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-green-600 border-green-600 hover:bg-green-50"
                  onClick={() => shareOnWhatsApp(selectedNews)}
                >
                  WhatsApp
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-blue-400 border-blue-400 hover:bg-blue-50"
                  onClick={() => shareOnTwitter(selectedNews)}
                >
                  X / Twitter
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-blue-600 border-blue-600 hover:bg-blue-50"
                  onClick={() => shareOnFacebook(selectedNews)}
                >
                  Facebook
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="bg-muted mt-12 py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Newspaper className="h-6 w-6 text-primary" />
                <span className="text-lg font-bold">NewsDesk</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Your trusted source for breaking news and in-depth coverage across all categories.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Categories</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {categories.slice(0, 5).map((cat) => (
                  <li key={cat.id}>
                    <button
                      onClick={() => setSelectedCategory(cat.slug)}
                      className="hover:text-primary transition-colors"
                    >
                      {cat.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Quick Links</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="/admin" className="hover:text-primary transition-colors">Admin Panel</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Subscribe</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Get the latest news delivered to your inbox.
              </p>
              <div className="flex gap-2">
                <Input placeholder="Your email" type="email" className="flex-1" />
                <Button size="sm">Subscribe</Button>
              </div>
            </div>
          </div>
          <Separator className="my-6" />
          <p className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} NewsDesk. All rights reserved.
          </p>
        </div>
      </footer>

      {/* Marquee animation styles */}
      <style jsx global>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
      `}</style>
    </div>
  );
}
