'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
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
  History,
  Crown,
  CheckCircle,
  Play,
  Image as ImageIcon,
  Upload,
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

// Generate session ID for anonymous users
const getSessionId = () => {
  if (typeof window === 'undefined') return 'server';
  let sessionId = localStorage.getItem('newsdesk_session');
  if (!sessionId) {
    sessionId = 'sess_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('newsdesk_session', sessionId);
  }
  return sessionId;
};

// Ad Component - Programmatic
const ProgrammaticAd = ({ placement, size = '728x90' }) => {
  const [loaded, setLoaded] = useState(false);
  
  useEffect(() => {
    // Simulate ad loading
    const timer = setTimeout(() => setLoaded(true), 500);
    
    // Track impression
    fetch('/api/ads/impression', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        adId: `prog_${placement}_${Date.now()}`,
        adType: 'programmatic',
        placement,
        sessionId: getSessionId(),
        estimatedRevenue: 0.002,
      }),
    }).catch(() => {});
    
    return () => clearTimeout(timer);
  }, [placement]);
  
  const [width, height] = size.split('x').map(Number);
  
  return (
    <div 
      className={`bg-gradient-to-r from-muted to-muted/50 border border-dashed border-muted-foreground/30 rounded-lg flex items-center justify-center transition-opacity ${loaded ? 'opacity-100' : 'opacity-50'}`}
      style={{ width: '100%', maxWidth: width, height: height }}
    >
      <div className="text-center text-muted-foreground text-xs">
        <p className="font-medium">Advertisement</p>
        <p className="text-[10px]">{size} • {placement}</p>
        <p className="text-[10px] mt-1">TODO: Add ad network code in .env</p>
      </div>
    </div>
  );
};

// Native Ad Component (looks like news)
const NativeAd = ({ className = '' }) => {
  useEffect(() => {
    fetch('/api/ads/impression', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        adId: `native_${Date.now()}`,
        adType: 'native',
        placement: 'in-article',
        sessionId: getSessionId(),
        estimatedRevenue: 0.005,
      }),
    }).catch(() => {});
  }, []);
  
  return (
    <Card className={`border-dashed border-primary/30 bg-primary/5 ${className}`}>
      <CardContent className="p-4">
        <Badge variant="outline" className="mb-2 text-[10px]">Sponsored</Badge>
        <div className="flex gap-3">
          <div className="w-20 h-20 bg-muted rounded flex items-center justify-center shrink-0">
            <ImageIcon className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <h4 className="font-medium text-sm line-clamp-2">Premium Content Partner</h4>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              Discover exclusive offers from our trusted partners. Click to learn more.
            </p>
            <Button size="sm" variant="link" className="p-0 h-auto text-xs mt-1">
              Learn More →
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Continue Reading Component
const ContinueReading = ({ history, onSelect }) => {
  if (!history || history.length === 0) return null;
  
  return (
    <Card className="mb-6 border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          Continue Reading
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {history.slice(0, 3).map((item) => (
            <div
              key={item.newsId}
              className="flex gap-3 cursor-pointer group p-2 rounded-lg hover:bg-background transition-colors"
              onClick={() => onSelect(item)}
            >
              <div className="w-16 h-16 rounded overflow-hidden shrink-0">
                <img
                  src={item.newsFeaturedImage || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=200'}
                  alt={item.newsTitle}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors">
                  {item.newsTitle}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Progress value={item.readPercentage} className="h-1 flex-1" />
                  <span className="text-xs text-muted-foreground shrink-0">
                    {item.readPercentage}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// Subscription Banner
const SubscriptionBanner = ({ onSubscribe }) => {
  return (
    <Card className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Crown className="h-6 w-6" />
              <h3 className="font-bold text-lg">Go Premium</h3>
            </div>
            <p className="text-sm opacity-90 mb-3">
              Unlimited articles, ad-free experience, and exclusive content
            </p>
            <Button variant="secondary" size="sm" onClick={onSubscribe}>
              View Plans
            </Button>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-3xl font-bold">₹299</p>
            <p className="text-xs opacity-80">/month</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Subscription Plans Modal
const SubscriptionPlans = ({ open, onClose }) => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (open) {
      fetch('/api/subscriptions/plans')
        .then(res => res.json())
        .then(data => {
          setPlans(data.plans || []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [open]);
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center">Choose Your Plan</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 py-4">
            {plans.map((plan) => (
              <Card key={plan.id} className={`relative ${plan.popular ? 'border-primary shadow-lg' : ''}`}>
                {plan.popular && (
                  <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary">
                    Most Popular
                  </Badge>
                )}
                <CardHeader className="text-center pb-2">
                  <CardTitle>{plan.name}</CardTitle>
                  <div className="mt-2">
                    <span className="text-3xl font-bold">
                      {plan.price === 0 ? 'Free' : `₹${plan.price}`}
                    </span>
                    {plan.price > 0 && (
                      <span className="text-muted-foreground text-sm">/{plan.period}</span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <ul className="space-y-2">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full" 
                    variant={plan.popular ? 'default' : 'outline'}
                    disabled={plan.id === 'free'}
                  >
                    {plan.id === 'free' ? 'Current Plan' : 'Subscribe'}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
        <p className="text-xs text-center text-muted-foreground">
          TODO: Add payment gateway (Stripe/Razorpay) credentials in .env
        </p>
      </DialogContent>
    </Dialog>
  );
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
  const [subscriptionDialogOpen, setSubscriptionDialogOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [userId, setUserId] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [readingHistory, setReadingHistory] = useState([]);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [youtubeLive, setYoutubeLive] = useState(null);
  // 'compact' = small player visible by default, 'expanded' = full 16:9, 'collapsed' = banner only
  const [playerState, setPlayerState] = useState('compact');
  const contentRef = useRef(null);
  
  // Get/Create user ID
  useEffect(() => {
    const storedUserId = localStorage.getItem('newsdesk_user_id');
    if (storedUserId) {
      setUserId(storedUserId);
    } else {
      const newUserId = 'user_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('newsdesk_user_id', newUserId);
      setUserId(newUserId);
    }
  }, []);
  
  // Fetch reading history
  useEffect(() => {
    if (userId) {
      fetch(`/api/users/${userId}/history`)
        .then(res => res.json())
        .then(data => setReadingHistory(data.history || []))
        .catch(() => {});
    }
  }, [userId]);

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

  // Fetch YouTube live status
  const fetchYoutubeLive = useCallback(async () => {
    try {
      const res = await fetch('/api/youtube/live');
      const data = await res.json();
      if (data.configured) setYoutubeLive(data);
    } catch (error) {
      console.error('YouTube live fetch error:', error);
    }
  }, []);

  // Seed data on first load
  const seedData = useCallback(async () => {
    try {
      await fetch('/api/seed', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
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
      fetchYoutubeLive();
    };
    init();
  }, [seedData, fetchCategories, fetchBreakingNews, fetchNews, fetchYoutubeLive]);

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

  // Track reading progress
  const handleScroll = useCallback(() => {
    if (contentRef.current && selectedNews) {
      const element = contentRef.current;
      const scrollTop = element.scrollTop;
      const scrollHeight = element.scrollHeight - element.clientHeight;
      const percentage = Math.min(Math.round((scrollTop / scrollHeight) * 100), 100);
      setScrollPosition(percentage);
    }
  }, [selectedNews]);

  // Save reading progress when closing article
  const saveReadingProgress = useCallback(async () => {
    if (selectedNews && userId && scrollPosition > 0) {
      try {
        await fetch('/api/users/reading-history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            newsId: selectedNews.id,
            newsTitle: selectedNews.title,
            newsExcerpt: selectedNews.excerpt,
            newsFeaturedImage: selectedNews.featuredImage,
            newsCategory: selectedNews.category,
            scrollPosition: scrollPosition,
            readPercentage: scrollPosition,
          }),
        });
        // Refresh reading history
        const res = await fetch(`/api/users/${userId}/history`);
        const data = await res.json();
        setReadingHistory(data.history || []);
      } catch (error) {
        console.error('Error saving reading progress:', error);
      }
    }
  }, [selectedNews, userId, scrollPosition]);

  // Handle article close
  const handleCloseArticle = () => {
    saveReadingProgress();
    setSelectedNews(null);
    setScrollPosition(0);
  };

  // Open article from history (continue reading)
  const handleContinueReading = async (historyItem) => {
    try {
      const res = await fetch(`/api/news/${historyItem.newsId}`);
      const data = await res.json();
      if (data.news) {
        setSelectedNews({ ...data.news, initialScrollPosition: historyItem.scrollPosition });
      }
    } catch (error) {
      toast.error('Failed to load article');
    }
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

              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setSubscriptionDialogOpen(true)}
                title="Premium"
              >
                <Crown className="h-5 w-5 text-yellow-500" />
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

      {/* Header Ad Banner */}
      <div className="container mx-auto px-4 py-4 flex justify-center">
        <ProgrammaticAd placement="header" size="728x90" />
      </div>

      {/* YouTube Live / Latest Section */}
      {youtubeLive && (
        <div className="container mx-auto px-4 mb-6">
          <div className="rounded-xl overflow-hidden border bg-black shadow-sm">

            {/* Always-visible header bar */}
            <div className="flex items-center justify-between px-4 py-2 bg-gray-900">
              <div className="flex items-center gap-2 min-w-0">
                {youtubeLive.isLive ? (
                  <span className="flex items-center gap-1.5 shrink-0">
                    <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-red-400 text-xs font-bold uppercase tracking-wide">Live</span>
                  </span>
                ) : (
                  <span className="text-gray-500 text-xs font-semibold uppercase tracking-wide shrink-0">Latest</span>
                )}
                <span className="text-white text-sm font-medium truncate">
                  {youtubeLive.title || 'NewsDesk'}
                </span>
              </div>

              {/* Toggle controls */}
              <div className="flex items-center gap-1 ml-4 shrink-0">
                {youtubeLive.videoId ? (
                  <>
                    {playerState === 'collapsed' && (
                      <button
                        onClick={() => setPlayerState('compact')}
                        className="text-gray-400 hover:text-white text-xs px-2 py-1 rounded transition-colors"
                        title="Show player"
                      >▶ Watch</button>
                    )}
                    {playerState === 'compact' && (
                      <button
                        onClick={() => setPlayerState('expanded')}
                        className="text-gray-400 hover:text-white text-xs px-2 py-1 rounded transition-colors"
                        title="Expand"
                      >⤢ Expand</button>
                    )}
                    {playerState === 'expanded' && (
                      <button
                        onClick={() => setPlayerState('compact')}
                        className="text-gray-400 hover:text-white text-xs px-2 py-1 rounded transition-colors"
                        title="Shrink"
                      >⤡ Shrink</button>
                    )}
                    {playerState !== 'collapsed' && (
                      <button
                        onClick={() => setPlayerState('collapsed')}
                        className="text-gray-400 hover:text-white text-xs px-2 py-1 rounded transition-colors ml-1"
                        title="Hide player"
                      >✕</button>
                    )}
                  </>
                ) : (
                  <a
                    href={`https://www.youtube.com/channel/${youtubeLive.channelId}/live`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-gray-400 hover:text-white text-xs px-2 py-1 rounded transition-colors"
                  >Watch on YouTube →</a>
                )}
              </div>
            </div>

            {/* Player — only shown when videoId is available and not collapsed */}
            {youtubeLive.videoId && playerState !== 'collapsed' && (
              <div
                className="relative w-full overflow-hidden transition-all duration-300"
                style={{ height: playerState === 'expanded' ? undefined : '420px', paddingBottom: playerState === 'expanded' ? '56.25%' : undefined }}
              >
                <iframe
                  className="absolute inset-0 w-full h-full"
                  src={`https://www.youtube.com/embed/${youtubeLive.videoId}?rel=0`}
                  title={youtubeLive.title || 'NewsDesk'}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main News Feed */}
          <div className="lg:col-span-3">
            {/* Continue Reading */}
            <ContinueReading history={readingHistory} onSelect={handleContinueReading} />
            
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
                  {news.slice(1).map((item, idx) => (
                    <React.Fragment key={item.id}>
                      <Card
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
                      {/* Insert native ad after every 3 articles */}
                      {(idx + 1) % 3 === 0 && idx !== news.length - 2 && (
                        <NativeAd />
                      )}
                    </React.Fragment>
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
          <aside className="lg:col-span-1 space-y-6">
            {/* Sidebar Ad */}
            <div className="flex justify-center">
              <ProgrammaticAd placement="sidebar" size="300x250" />
            </div>
            
            {/* Subscription Banner */}
            <SubscriptionBanner onSubscribe={() => setSubscriptionDialogOpen(true)} />

            {/* Trending */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Trending Now
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {(breakingNews.length > 0 ? breakingNews : news.slice(5, 10)).slice(0, 5).map((item, idx) => (
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
            <Card>
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
      <Dialog open={!!selectedNews} onOpenChange={handleCloseArticle}>
        <DialogContent className="max-w-3xl max-h-[90vh] p-0 overflow-hidden">
          {selectedNews && (
            <ScrollArea 
              className="max-h-[90vh]" 
              ref={contentRef}
              onScroll={handleScroll}
            >
              <div className="relative aspect-video">
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
                {/* Reading progress bar */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20">
                  <div 
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${scrollPosition}%` }}
                  />
                </div>
              </div>
              
              <div className="p-6">
                <DialogHeader>
                  <DialogTitle className="text-2xl">{selectedNews.title}</DialogTitle>
                </DialogHeader>
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground my-4">
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

                {/* In-Article Ad */}
                <div className="my-6">
                  <NativeAd />
                </div>

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

                {/* Footer Ad */}
                <div className="mt-6 flex justify-center">
                  <ProgrammaticAd placement="article-footer" size="728x90" />
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* Subscription Plans Modal */}
      <SubscriptionPlans 
        open={subscriptionDialogOpen} 
        onClose={() => setSubscriptionDialogOpen(false)} 
      />

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
