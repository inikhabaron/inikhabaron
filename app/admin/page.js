'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Plus, Edit, Trash2, Check, X, Eye, Clock, FileText, Users,
  BarChart3, Home, Send, AlertCircle, Tag, Image as ImageIcon,
  Loader2, ChevronRight, CheckCircle, XCircle, History, TrendingUp,
  Upload, LogOut, Search, ChevronDown, Pencil, Video, MoreVertical,
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, List,
  Link, Smile, Undo, Redo, MoreHorizontal, Type, Calendar, Menu,
} from 'lucide-react';
import {
  LineChart, Line, BarChart as RBarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

import dynamic from "next/dynamic";
import "react-quill/dist/quill.snow.css";
import { useRouter } from 'next/navigation';


// ─── CODE 1: STATUS CONSTANTS ──────────────────────────────────────────────────
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
  reporter: [{ value: 'draft', label: 'Draft' }],
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
    { value: 'all', label: 'All' }, { value: 'draft', label: 'Draft' },
    { value: 'pending_review', label: 'Pending Review' }, { value: 'needs_revision', label: 'Needs Revision' },
  ],
  editor: [
    { value: 'all', label: 'All' }, { value: 'draft', label: 'Draft' },
    { value: 'pending_review', label: 'Pending Review' }, { value: 'needs_revision', label: 'Needs Revision' },
    { value: 'ready_to_publish', label: 'Ready to Publish' }, { value: 'published', label: 'Published' },
    { value: 'scheduled', label: 'Scheduled' }, { value: 'rejected', label: 'Rejected' }
  ],
  admin: [
    { value: 'all', label: 'All' }, { value: 'draft', label: 'Draft' },
    { value: 'pending_review', label: 'Pending Review' }, { value: 'needs_revision', label: 'Needs Revision' },
    { value: 'ready_to_publish', label: 'Ready to Publish' }, { value: 'published', label: 'Published' },
    { value: 'scheduled', label: 'Scheduled' }, { value: 'rejected', label: 'Rejected' },
  ],
};

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

// ─── CODE 2: DESIGN SYSTEM ─────────────────────────────────────────────────────
const SIDEBAR_W = 230;

const STATUS_LABELS = {
  draft: 'Drafts', pending_review: 'Pending', needs_revision: 'Revision',
  ready_to_publish: 'Ready', published: 'Published', scheduled: 'Scheduled', rejected: 'Rejected',
};

const STATUS_STYLES = {
  draft: { color: '#b45309', bg: '#fef3c7' },
  pending_review: { color: '#1d4ed8', bg: '#dbeafe' },
  needs_revision: { color: '#c2410c', bg: '#ffedd5' },
  ready_to_publish: { color: '#6d28d9', bg: '#ede9fe' },
  published: { color: '#065f46', bg: '#d1fae5' },
  scheduled: { color: '#0e7490', bg: '#cffafe' },
  rejected: { color: '#991b1b', bg: '#fee2e2' },
};

const DS = {
  sidebar: {
    width: SIDEBAR_W, minWidth: SIDEBAR_W, background: '#0f1d35', color: '#fff',
    display: 'flex', flexDirection: 'column', height: '100vh',
    position: 'fixed', left: 0, top: 0, zIndex: 200,
    transition: 'transform 0.25s ease', fontFamily: "'DM Sans', sans-serif",
  },
  navItem: (active) => ({
    display: 'flex', alignItems: 'center', gap: 10, padding: '9px 16px',
    borderRadius: 8, margin: '2px 12px', cursor: 'pointer',
    background: active ? '#2563eb' : 'transparent',
    color: active ? '#fff' : '#94a3b8', fontSize: 14,
    fontWeight: active ? 600 : 400, transition: 'all 0.15s', userSelect: 'none',
  }),
  main: (sidebarVisible) => ({
    marginLeft: sidebarVisible ? SIDEBAR_W : 0, display: 'flex',
    flexDirection: 'column', minHeight: '100vh', background: '#f0f2f5', flex: 1,
    transition: 'margin-left 0.25s ease', fontFamily: "'DM Sans', sans-serif",
  }),
  header: {
    background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '0 24px',
    height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    position: 'sticky', top: 0,
  },
  card: { background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' },
  btn: (variant = 'primary', extra = {}) => {
    const base = { borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, border: 'none', ...extra };
    if (variant === 'primary') return { ...base, background: '#2563eb', color: '#fff', padding: '8px 18px' };
    if (variant === 'outline') return { ...base, background: '#fff', color: '#374151', border: '1px solid #e5e7eb', padding: '8px 18px' };
    if (variant === 'ghost') return { ...base, background: 'transparent', color: '#6b7280', padding: '5px 8px', fontSize: 13 };
    if (variant === 'danger') return { ...base, background: '#fff', color: '#dc2626', border: '1px solid #fecaca', padding: '8px 18px' };
    return base;
  },
  input: {
    width: '100%', padding: '9px 13px', border: '1px solid #e5e7eb',
    borderRadius: 8, fontSize: 14, outline: 'none', color: '#1f2937',
    background: '#fff', boxSizing: 'border-box', fontFamily: 'inherit',
  },
  label: { fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6, display: 'block' },
  badge: (status) => {
    const s = STATUS_STYLES[status] || STATUS_STYLES.draft;
    return { background: s.bg, color: s.color, fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 20, display: 'inline-block', whiteSpace: 'nowrap' };
  },
  tag: { background: '#f3f4f6', color: '#4b5563', fontSize: 12, fontWeight: 500, padding: '2px 9px', borderRadius: 6, display: 'inline-block' },
  sectionNum: { width: 28, height: 28, borderRadius: '50%', background: '#2563eb', color: '#fff', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  tab: (active) => ({
    padding: '8px 18px', color: active ? '#2563eb' : '#6b7280', fontSize: 14,
    fontWeight: active ? 600 : 400, cursor: 'pointer', background: 'transparent',
    border: 'none', borderBottom: active ? '2px solid #2563eb' : '2px solid transparent',
  }),
  select: {
    padding: '8px 32px 8px 12px', border: '1px solid #e5e7eb', borderRadius: 8,
    fontSize: 13, color: '#374151', background: '#fff', appearance: 'none',
    outline: 'none', cursor: 'pointer',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center', fontFamily: 'inherit',
  },
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
    zIndex: 199, display: 'flex',
  },
};

const toolbarBtn = {
  width: 30,
  height: 30,
  border: 'none',
  borderRadius: 6,
  background: '#f3f4f6',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

// ─── CODE 1: IMAGE UPLOAD COMPONENT (PRESERVED EXACTLY) ────────────────────────
const ImageUpload = ({ value, onChange, folder = 'news' }) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error('Image size must be less than 10MB'); return; }

    setUploading(true); setProgress(10);
    try {
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
      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', sigData.apiKey);
      formData.append('timestamp', sigData.timestamp);
      formData.append('signature', sigData.signature);
      formData.append('folder', sigData.folder);
      formData.append('resource_type', sigData.resourceType || 'image');
      setProgress(50);
      const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${sigData.cloudName}/image/upload`, { method: 'POST', body: formData });
      setProgress(80);
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.error?.message || 'Cloudinary upload failed');
      if (uploadData.secure_url) { onChange(uploadData.secure_url); toast.success('Image uploaded successfully!'); }
      else throw new Error(uploadData.error?.message || 'Upload failed');
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input type="file" accept="image/*" onChange={handleFileChange} disabled={uploading}
          style={{ flex: 1, padding: '6px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 13 }} />
        {uploading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: 12, color: '#6b7280' }}>{progress}%</span>
          </div>
        )}
      </div>
      {value && (
        <div style={{ position: 'relative', width: '100%', height: 140, borderRadius: 8, overflow: 'hidden', border: '1px solid #e5e7eb' }}>
          <img src={value} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <button onClick={() => onChange('')} style={{ position: 'absolute', top: 8, right: 8, width: 24, height: 24, background: '#dc2626', border: 'none', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={12} color="#fff" />
          </button>
        </div>
      )}
      {/* <input value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder="Or paste image URL directly"
        style={{ ...DS.input, fontSize: 12 }} /> */}
    </div>
  );
};

const MultiImageUpload = ({ images = [], onChange }) => {
  const handleAdd = (url) => {
    onChange([...images, { url, crop: null }]);
  };

  const removeImage = (index) => {
    const updated = [...images];
    updated.splice(index, 1);
    onChange(updated);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      
      <ImageUpload
        value=""
        onChange={(url) => handleAdd(url)}
      />

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {images.map((img, i) => (
          <div key={i} style={{
            position: 'relative',
            width: 120,
            height: 100,
            borderRadius: 8,
            overflow: 'hidden',
            border: '1px solid #e5e7eb'
          }}>
            <img src={img.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />

            <button onClick={() => removeImage(i)}
              style={{
                position: 'absolute',
                top: 5,
                right: 5,
                background: '#dc2626',
                border: 'none',
                borderRadius: 4,
                color: '#fff',
                cursor: 'pointer'
              }}>
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── SIDEBAR ────────────────────────────────────────────────────────────────────
function Sidebar({ activeTab, onTabChange, currentUser, isOpen, onClose, isMobile }) {
  const NAV = [
    { id: 'dashboard', icon: BarChart3, label: 'Dashboard', roles: null },
    { id: 'news', icon: FileText, label: 'Posts', roles: null },
    { id: 'livestream', icon: Video, label: 'Live Stream', roles: null },
    { id: 'categories', icon: Tag, label: 'Categories', roles: ['admin', 'editor'] },
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
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 32, height: 32, background: '#2563eb', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Pencil size={15} color="#fff" />
            </div>
            <span style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>
              Dash<span style={{ color: '#60a5fa' }}>Board</span>
            </span>
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

// ─── HEADER ─────────────────────────────────────────────────────────────────────
function Header({ currentUser, onLogout, searchQuery, onSearchChange, onToggleSidebar, activeTab }) {
  const BREADCRUMBS = {
    dashboard: ['Dashboard'], news: ['Posts'], categories: ['Categories'],
    users: ['Users'], livestream: ['Live Stream'],
  };
  const crumbs = BREADCRUMBS[activeTab] || [activeTab];
  const router = useRouter();

  return (
    <div style={DS.header}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* <button onClick={onToggleSidebar} style={{ ...DS.btn('ghost'), padding: 6, color: '#6b7280' }}>
          <Menu size={20} />
        </button> */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#6b7280', fontSize: 13 }}>
          <Home
            size={14}
            color="#9ca3af"
            style={{ cursor: 'pointer' }}
            onClick={() => router.push('/')} // ✅ redirect
          />
          {crumbs.map((b, i) => (
            <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <ChevronRight size={12} color="#d1d5db" />
              <span style={{ color: i === crumbs.length - 1 ? '#374151' : '#6b7280', fontWeight: i === crumbs.length - 1 ? 500 : 400 }}>{b}</span>
            </span>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={14} style={{ position: 'absolute', left: 11, color: '#9ca3af', pointerEvents: 'none' }} />
          <input
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Search articles..."
            style={{ ...DS.input, paddingLeft: 34, width: 220, fontSize: 13, background: '#f9fafb', border: '1px solid #f0f0f0' }}
          />
          {searchQuery && (
            <button onClick={() => onSearchChange('')} style={{ position: 'absolute', right: 10, background: 'transparent', border: 'none', cursor: 'pointer', color: '#9ca3af', display: 'flex' }}>
              <X size={13} />
            </button>
          )}
        </div>

        <div style={{ width: 1, height: 26, background: '#e5e7eb' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#667eea,#764ba2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, color: '#fff', flexShrink: 0 }}>
            {currentUser?.name?.[0] || 'A'}
          </div>
          <span style={{ fontSize: 13, fontWeight: 500, color: '#374151', whiteSpace: 'nowrap' }}>
            {currentUser?.name || 'Admin'}
          </span>
          {/* <ChevronDown size={13} color="#9ca3af" /> */}
        </div>

        <button onClick={onLogout} style={{ ...DS.btn('ghost'), color: '#6b7280', padding: '6px 8px' }} title="Logout">
          <LogOut size={15} />
        </button>
      </div>
    </div>
  );
}

// ─── DASHBOARD VIEW (Code 1 data + Code 2 design, no Quick Actions, full-width top articles) ──
function DashboardView({ analytics, loading }) {
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 300 }}>
        <Loader2 size={50} style={{ animation: 'spin 1s linear infinite', color: '#2563eb' }} />
      </div>
    );
  }
  if (!analytics) return null;

  const chartData = analytics.chartData || [
    { name: 'Jan', views: 10, articles: 50 }, { name: 'Feb', views: 30, articles: 60 },
    { name: 'Mar', views: 20, articles: 70 }, { name: 'Apr', views: 25, articles: 50 },
    { name: 'May', views: 16, articles: 65 }, { name: 'Jun', views: 12, articles: 45 },
  ];

  return (
    <div style={{ padding: 24 }}>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Articles', value: analytics.stats?.totalNews || 0, icon: FileText, color: '#2563eb', bg: '#eff6ff' },
          { label: 'Published', value: analytics.stats?.publishedNews || 0, icon: CheckCircle, color: '#059669', bg: '#f0fdf4' },
          { label: 'Pending Review', value: (analytics.stats?.draftNews || 0) + (analytics.stats?.pendingReviewNews || 0) + (analytics.stats?.needsRevisionNews || 0), icon: Clock, color: '#d97706', bg: '#fffbeb' },
          { label: 'Total Views', value: (analytics.stats?.totalViews || 0).toLocaleString(), icon: Eye, color: '#7c3aed', bg: '#faf5ff' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} style={{ ...DS.card, padding: '20px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>{label}</div>
                <div style={{ fontSize: 26, fontWeight: 700, color: '#111827' }}>{value}</div>
              </div>
              <div style={{ width: 42, height: 42, background: bg, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={19} color={color} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 20, marginBottom: 24 }}>
        <div style={DS.card}>
          <div style={{ padding: '18px 20px 4px', fontSize: 15, fontWeight: 700, color: '#111827', display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingUp size={16} color="#2563eb" />Views Over Time
          </div>
          <div style={{ padding: '4px 12px 16px' }}>
            <ResponsiveContainer width="100%" height={190}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12 }} />
                <Line type="monotone" dataKey="views" stroke="#2563eb" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={DS.card}>
          <div style={{ padding: '18px 20px 4px', fontSize: 15, fontWeight: 700, color: '#111827' }}>Articles by Month</div>
          <div style={{ padding: '4px 12px 16px' }}>
            <ResponsiveContainer width="100%" height={190}>
              <RBarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="articles" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </RBarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Performing Articles — full width */}
      <div style={DS.card}>
        <div style={{ padding: '18px 22px 0', fontSize: 15, fontWeight: 700, color: '#111827', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <TrendingUp size={16} color="#2563eb" />Top Performing Articles
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
              {['Title', 'Category', 'Views', 'Shares'].map(h => (
                <th key={h} style={{ padding: '10px 18px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6b7280', background: '#f9fafb' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(analytics.topArticles || []).map((article) => (
              <tr key={article.id} style={{ borderBottom: '1px solid #f9fafb' }}
                onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                <td style={{ padding: '12px 18px', fontSize: 13, color: '#374151', maxWidth: 400 }}>
                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{article.title}</div>
                </td>
                <td style={{ padding: '12px 18px' }}>
                  <span style={{ ...DS.tag, border: '1px solid #e5e7eb', background: '#f9fafb' }}>{article.category}</span>
                </td>
                <td style={{ padding: '12px 18px', fontSize: 13, color: '#374151', fontWeight: 500 }}>
                  {(article.views || 0).toLocaleString()}
                </td>
                <td style={{ padding: '12px 18px', fontSize: 13, color: '#374151' }}>
                  {((article.shares?.whatsapp || 0) + (article.shares?.twitter || 0) + (article.shares?.facebook || 0)).toLocaleString()}
                </td>
              </tr>
            ))}
            {(!analytics.topArticles || analytics.topArticles.length === 0) && (
              <tr><td colSpan={4} style={{ padding: '32px', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>No data available</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── NEWS LIST VIEW ─────────────────────────────────────────────────────────────
function NewsListView({
  news, categories, currentUser, newsStatusFilter, onStatusFilterChange,
  searchQuery, loading, onEdit, onDelete, onWorkflow, onAddNew, onViewVersionHistory,
}) {
  const [openMenuId, setOpenMenuId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [page, setPage] = useState(1);
  const perPage = 6;

  const STATUS_TABS = [
    { id: 'all', label: 'All', filter: 'all' },
    { id: 'published', label: 'Published', filter: 'published' },
    { id: 'pending', label: 'Pending', filter: 'pending_review' },
    { id: 'drafts', label: 'Drafts', filter: 'draft' },
  ];

  // Find active tab from current filter
  const activeTabId = STATUS_TABS.find(t => t.filter === newsStatusFilter)?.id || 'all';

  const filtered = news.filter(item => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.title?.toLowerCase().includes(q) ||
      item.category?.toLowerCase().includes(q) ||
      (Array.isArray(item.tags) && item.tags.some(t => t.toLowerCase().includes(q)))
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const toggleSelect = (id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const allSelected = paginated.length > 0 && paginated.every(p => selectedIds.includes(p.id));
  const toggleAll = () => setSelectedIds(allSelected ? [] : paginated.map(p => p.id));

  useEffect(() => { setPage(1); }, [newsStatusFilter, searchQuery]);

  return (
    <div style={{ padding: 24 }}>
      <div style={DS.card}>
        {/* Header row */}
        <div style={{ padding: '18px 22px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>Posts</span>
            <button onClick={onAddNew} style={{ width: 26, height: 26, borderRadius: '50%', background: '#2563eb', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Plus size={14} color="#fff" />
            </button>
          </div>
          <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {STATUS_TABS.map(t => (
              <button key={t.id} style={DS.tab(activeTabId === t.id)}
                onClick={() => onStatusFilterChange(t.filter)}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Status filter (role-based) */}
        <div style={{ padding: '12px 22px', borderBottom: '1px solid #f3f4f6', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 500 }}>Status:</span>
          <select value={newsStatusFilter} onChange={e => onStatusFilterChange(e.target.value)} style={{ ...DS.select, minWidth: 160, fontSize: 12 }}>
            {(statusFilterOptionsByRole[currentUser?.role] || statusFilterOptionsByRole.admin).map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {searchQuery && (
            <span style={{ fontSize: 12, color: '#6b7280' }}>
              Showing results for "<strong>{searchQuery}</strong>" — {filtered.length} found
            </span>
          )}
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ padding: 60, display: 'flex', justifyContent: 'center' }}>
            <Loader2 size={28} style={{ animation: 'spin 1s linear infinite', color: '#2563eb' }} />
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '1px solid #f3f4f6' }}>
                  <th style={{ padding: '11px 16px', width: 40 }}>
                    <div style={{ width: 16, height: 16, border: '1.5px solid #d1d5db', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: allSelected ? '#2563eb' : '#fff' }}
                      onClick={toggleAll}>
                      {allSelected && <Check size={10} color="#fff" />}
                    </div>
                  </th>
                  {['Title / Description', 'Author', 'Tags', 'Date', 'Status', ''].map((h, i) => (
                    <th key={i} style={{ padding: '11px 14px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6b7280' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map(item => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #f3f4f6' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                    onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                    <td style={{ padding: '13px 16px' }}>
                      <div style={{ width: 16, height: 16, border: '1.5px solid #d1d5db', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: selectedIds.includes(item.id) ? '#2563eb' : '#fff' }}
                        onClick={() => toggleSelect(item.id)}>
                        {selectedIds.includes(item.id) && <Check size={10} color="#fff" />}
                      </div>
                    </td>
                    <td style={{ padding: '13px 14px', maxWidth: 260 }}>
                      <div style={{ display: 'flex', gap: 5, marginBottom: 3, flexWrap: 'wrap' }}>
                        {item.isBreaking && <span style={{ background: '#fee2e2', color: '#991b1b', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 4 }}>BREAKING</span>}
                        {item.isTrending && <span style={{ background: '#dbeafe', color: '#1d4ed8', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 4 }}>TRENDING</span>}
                        {item.breakingSuggested && !item.breakingApproved && <span style={{ background: '#ffedd5', color: '#9a3412', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 4 }}>BREAKING?</span>}
                        {item.trendingSuggested && !item.isTrending && <span style={{ background: '#f3e8ff', color: '#6d28d9', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 4 }}>TRENDING?</span>}
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</div>
                      <div style={{ fontSize: 11, color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.excerpt}</div>
                    </td>
                    <td style={{ padding: '13px 14px', fontSize: 13, color: '#374151', whiteSpace: 'nowrap' }}>{item.authorName || '-'}</td>
                    <td style={{ padding: '13px 14px' }}>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {(Array.isArray(item.tags) ? item.tags : []).slice(0, 2).map(t => (
                          <span key={t} style={DS.tag}>{t}</span>
                        ))}
                        {Array.isArray(item.tags) && item.tags.length > 2 && (
                          <span style={{ ...DS.tag, background: '#e0e7ff', color: '#4338ca' }}>+{item.tags.length - 2} more</span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '13px 14px', fontSize: 11, color: '#6b7280', whiteSpace: 'nowrap' }}>
                      {new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td style={{ padding: '13px 14px' }}>
                      <span style={DS.badge(item.status)}>{STATUS_LABELS[item.status] || item.status}</span>
                    </td>
                    <td style={{ padding: '13px 14px' }}>
                      <div style={{ position: 'relative' }}>
                        <button style={DS.btn('ghost')} onClick={() => setOpenMenuId(openMenuId === item.id ? null : item.id)}>
                          <MoreVertical size={15} />
                        </button>
                        {openMenuId === item.id && (
                          <div style={{ position: 'absolute', right: 0, top: '100%', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 50, minWidth: 190, overflow: 'hidden' }}>
                            <div style={{ padding: '4px 0' }}>
                              {/* Edit */}
                              {((currentUser?.role === 'admin') ||
                                (currentUser?.role === 'editor' && ['draft', 'needs_revision'].includes(item.status)) ||
                                (currentUser?.role === 'reporter' && item.status === 'draft' && item.authorId === currentUser?.id)) && (
                                <MenuBtn icon={Edit} label="Edit" color="#374151" onClick={() => { onEdit(item); setOpenMenuId(null); }} />
                              )}
                              {/* Workflow: reporter submit */}
                              {currentUser?.role === 'reporter' && item.status === 'draft' && (
                                <MenuBtn icon={Send} label="Submit for Review" color="#1d4ed8" onClick={() => { onWorkflow(item.id, 'submit'); setOpenMenuId(null); }} />
                              )}
                              {/* Workflow: reporter resubmit */}
                              {currentUser?.role === 'reporter' && item.status === 'needs_revision' && (
                                <MenuBtn icon={Send} label="Resubmit" color="#1d4ed8" onClick={() => { onWorkflow(item.id, 'submit'); setOpenMenuId(null); }} />
                              )}
                              {/* Workflow: editor approve/revise */}
                              {currentUser?.role === 'editor' && item.status === 'pending_review' && (
                                <>
                                  <MenuBtn icon={Check} label="Approve" color="#059669" onClick={() => { onWorkflow(item.id, 'approve'); setOpenMenuId(null); }} />
                                  <MenuBtn icon={X} label="Request Revision" color="#ea580c" onClick={() => { onWorkflow(item.id, 'revise'); setOpenMenuId(null); }} />
                                </>
                              )}
                              {/* Workflow: admin publish */}
                              {currentUser?.role === 'admin' && item.status === 'ready_to_publish' && (
                                <MenuBtn icon={CheckCircle} label="Publish" color="#059669" onClick={() => { onWorkflow(item.id, 'publish'); setOpenMenuId(null); }} />
                              )}
                              {/* Approve breaking */}
                              {currentUser?.role === 'admin' && item.breakingSuggested && !item.breakingApproved && (
                                <MenuBtn icon={AlertCircle} label="Approve Breaking" color="#dc2626" onClick={() => { onWorkflow(item.id, 'approve-breaking'); setOpenMenuId(null); }} />
                              )}
                              {/* Approve trending */}
                              {(currentUser?.role === 'admin' || currentUser?.role === 'editor') && item.trendingSuggested && !item.isTrending && (
                                <MenuBtn icon={TrendingUp} label="Approve Trending" color="#7c3aed" onClick={() => { onWorkflow(item.id, 'approve-trending'); setOpenMenuId(null); }} />
                              )}
                              {/* Version history */}
                              <MenuBtn icon={History} label="Version History" color="#374151" onClick={() => { onViewVersionHistory(item.id); setOpenMenuId(null); }} />
                              {/* Delete */}
                              {currentUser?.role === 'admin' && (
                                <>
                                  <div style={{ height: 1, background: '#f3f4f6', margin: '4px 0' }} />
                                  <MenuBtn icon={Trash2} label="Delete" color="#dc2626" hoverBg="#fff5f5" onClick={() => { onDelete(item.id); setOpenMenuId(null); }} />
                                </>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {paginated.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ padding: '48px', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
                      {searchQuery ? `No articles matching "${searchQuery}"` : 'No articles found'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ padding: '12px 22px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', borderTop: '1px solid #f3f4f6', gap: 4 }}>
            <PaginationBtn disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
              <ChevronRight size={13} style={{ transform: 'rotate(180deg)' }} />
            </PaginationBtn>
            {[...Array(Math.min(totalPages, 9))].map((_, i) => {
              const p = i + 1;
              if (totalPages > 7 && i === 5) return <span key="dots" style={{ padding: '0 4px', color: '#9ca3af', fontSize: 13 }}>...</span>;
              if (totalPages > 7 && i > 5 && i < totalPages - 1) return null;
              return (
                <button key={p} onClick={() => setPage(p)}
                  style={{ width: 32, height: 32, border: `1px solid ${page === p ? '#2563eb' : '#e5e7eb'}`, borderRadius: 8, background: page === p ? '#2563eb' : '#fff', color: page === p ? '#fff' : '#374151', fontSize: 13, fontWeight: page === p ? 600 : 400, cursor: 'pointer' }}>
                  {p}
                </button>
              );
            })}
            <PaginationBtn disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
              <ChevronRight size={13} />
            </PaginationBtn>
          </div>
        )}
      </div>
    </div>
  );
}

function MenuBtn({ icon: Icon, label, color, hoverBg = '#f9fafb', onClick }) {
  return (
    <button style={{ width: '100%', padding: '9px 16px', fontSize: 13, color, background: 'transparent', border: 'none', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 9 }}
      onMouseEnter={e => e.currentTarget.style.background = hoverBg}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      onClick={onClick}>
      <Icon size={14} />{label}
    </button>
  );
}

function PaginationBtn({ disabled, onClick, children }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ width: 32, height: 32, border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.4 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {children}
    </button>
  );
}

// ─── CATEGORIES VIEW ─────────────────────────────────────────────────────────────
function CategoriesView({ categories, loading, onAdd, onEdit, onDelete }) {
  if (loading) return <LoadingSpinner />;
  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', margin: 0 }}>Categories</h2>
        <button style={DS.btn('primary')} onClick={onAdd}><Plus size={15} />Add Category</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16 }}>
        {categories.map(cat => (
          <div key={cat.id} style={DS.card}>
            <div style={{ padding: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 14, height: 14, borderRadius: '50%', background: cat.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{cat.name}</span>
                </div>
                <span style={{ background: cat.isActive ? '#d1fae5' : '#f3f4f6', color: cat.isActive ? '#065f46' : '#6b7280', fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 20 }}>
                  {cat.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 6px' }}>{cat.description || 'No description'}</p>
              <p style={{ fontSize: 11, color: '#9ca3af', margin: '0 0 14px' }}>Slug: <code style={{ background: '#f3f4f6', padding: '1px 5px', borderRadius: 4 }}>{cat.slug}</code></p>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button style={{ ...DS.btn('outline'), padding: '6px 12px' }} onClick={() => onEdit(cat)}><Edit size={13} />Edit</button>
                <button style={{ ...DS.btn('danger'), padding: '6px 12px' }} onClick={() => onDelete(cat.id)}><Trash2 size={13} /></button>
              </div>
            </div>
          </div>
        ))}
        {categories.length === 0 && (
          <div style={{ gridColumn: '1/-1', padding: '48px', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>No categories found</div>
        )}
      </div>
    </div>
  );
}

// ─── USERS VIEW ──────────────────────────────────────────────────────────────────
function UsersView({ users, loading, onAdd, onEdit, onDelete, formatDate }) {
  if (loading) return <LoadingSpinner />;
  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', margin: 0 }}>Users</h2>
        <button style={DS.btn('primary')} onClick={onAdd}><Plus size={15} />Add User</button>
      </div>
      <div style={{ ...DS.card, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
          <thead>
            <tr style={{ background: '#f9fafb', borderBottom: '1px solid #f3f4f6' }}>
              {['Name', 'Email', 'Role', 'Verified', 'Joined', 'Actions'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6b7280' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} style={{ borderBottom: '1px solid #f9fafb' }}
                onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                <td style={{ padding: '13px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, color: '#1d4ed8', flexShrink: 0 }}>
                      {user.name?.[0]}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 500, color: '#111827' }}>{user.name}</span>
                  </div>
                </td>
                <td style={{ padding: '13px 16px', fontSize: 12, color: '#6b7280' }}>{user.email}</td>
                <td style={{ padding: '13px 16px' }}>
                  <span style={{ ...DS.tag, border: '1px solid #e5e7eb', textTransform: 'capitalize' }}>{user.role}</span>
                </td>
                <td style={{ padding: '13px 16px' }}>
                  {user.isVerified ? <CheckCircle size={16} color="#059669" /> : <XCircle size={16} color="#d1d5db" />}
                </td>
                <td style={{ padding: '13px 16px', fontSize: 12, color: '#6b7280' }}>{formatDate(user.createdAt)}</td>
                <td style={{ padding: '13px 16px' }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button style={DS.btn('ghost')} onClick={() => onEdit(user)}><Edit size={14} /></button>
                    <button style={{ ...DS.btn('ghost'), color: '#dc2626' }} onClick={() => onDelete(user.id)}><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr><td colSpan={6} style={{ padding: '48px', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>No users found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── LIVE STREAM VIEW ─────────────────────────────────────────────────────────────
function LiveStreamView({ ytForm, setYtForm, onSave, onClear, ytSaving }) {
  return (
    <div style={{ padding: 24, maxWidth: 680 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', margin: '0 0 20px' }}>Live Stream Settings</h2>
      <div style={DS.card}>
        <div style={{ padding: 24 }}>
          <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 20 }}>
            Paste any YouTube video ID to embed it as a live stream on the homepage. Overrides automatic channel detection.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={DS.label}>YouTube Video ID <span style={{ color: '#dc2626' }}>*</span></label>
              <input style={DS.input} placeholder="e.g. dQw4w9WgXcQ"
                value={ytForm.videoId}
                onChange={e => setYtForm({ ...ytForm, videoId: e.target.value.trim() })} />
              <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 5 }}>
                From any YouTube URL: youtube.com/watch?v=<strong>THIS_PART</strong> or youtu.be/<strong>THIS_PART</strong>
              </p>
            </div>
            <div>
              <label style={DS.label}>Display Title <span style={{ fontSize: 11, color: '#9ca3af' }}>(optional)</span></label>
              <input style={DS.input} placeholder="e.g. BBC News Live"
                value={ytForm.title}
                onChange={e => setYtForm({ ...ytForm, title: e.target.value })} />
              <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 5 }}>Shown in the banner. Leave blank to use YouTube's video title.</p>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
              <div style={{ width: 44, height: 24, background: ytForm.isLive ? '#2563eb' : '#e5e7eb', borderRadius: 12, position: 'relative', transition: 'background 0.2s', cursor: 'pointer', flexShrink: 0 }}
                onClick={() => setYtForm({ ...ytForm, isLive: !ytForm.isLive })}>
                <div style={{ position: 'absolute', top: 2, left: ytForm.isLive ? 22 : 2, width: 20, height: 20, background: '#fff', borderRadius: '50%', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: '#374151' }}>Mark as Live</div>
                <div style={{ fontSize: 12, color: '#9ca3af' }}>Shows the red pulsing LIVE badge on the banner</div>
              </div>
            </label>
            {ytForm.videoId && (
              <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                <div style={{ fontSize: 12, color: '#9ca3af', padding: '8px 14px', background: '#f9fafb' }}>Preview</div>
                <div style={{ position: 'relative', paddingBottom: '56.25%' }}>
                  <iframe src={`https://www.youtube.com/embed/${ytForm.videoId}?rel=0`} title="Preview"
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen />
                </div>
              </div>
            )}
            <div style={{ display: 'flex', gap: 12, paddingTop: 4 }}>
              <button style={{ ...DS.btn('primary'), opacity: (!ytForm.videoId || ytSaving) ? 0.6 : 1 }}
                onClick={onSave} disabled={ytSaving || !ytForm.videoId}>
                {ytSaving ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Video size={14} />}
                Save & Go Live
              </button>
              <button style={DS.btn('outline')} onClick={onClear} disabled={ytSaving}>
                Clear / Go Offline
              </button>
            </div>
          </div>
        </div>
      </div>

      <div style={{ ...DS.card, marginTop: 20 }}>
        <div style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 10 }}>Fallback — Channel Auto-Detection</div>
          <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 8px' }}>When no Video ID is set above, the system falls back to:</p>
          <ol style={{ fontSize: 13, color: '#6b7280', paddingLeft: 20, margin: 0, lineHeight: 1.8 }}>
            <li>Check if your configured channel is live (requires YouTube API key)</li>
            <li>Embed latest uploaded video from the channel</li>
            <li>Open YouTube channel page in a new tab (if no API key)</li>
          </ol>
          <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 12 }}>
            Configure <code style={{ background: '#f3f4f6', padding: '1px 5px', borderRadius: 4 }}>YOUTUBE_CHANNEL_ID</code> and optionally{' '}
            <code style={{ background: '#f3f4f6', padding: '1px 5px', borderRadius: 4 }}>YOUTUBE_API_KEY</code> in your{' '}
            <code style={{ background: '#f3f4f6', padding: '1px 5px', borderRadius: 4 }}>.env</code> file for auto-detection.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── SHARED HELPERS ───────────────────────────────────────────────────────────────
function LoadingSpinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 80 }}>
      <Loader2 size={28} style={{ animation: 'spin 1s linear infinite', color: '#2563eb' }} />
    </div>
  );
}

// ─── MAIN ADMIN PAGE (CODE 1 LOGIC PRESERVED EXACTLY) ─────────────────────────
export default function AdminPage() {
  // ── Code 1 State ──
  const [activeTab, setActiveTab] = useState('dashboard');
  const [news, setNews] = useState([]);
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newsStatusFilter, setNewsStatusFilter] = useState('all');
  const [currentUser, setCurrentUser] = useState(null);

  const [editingNews, setEditingNews] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [isNewsDialogOpen, setIsNewsDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false);
  const [versionHistory, setVersionHistory] = useState([]);

  const [newsForm, setNewsForm] = useState({
    title: '', content: '', excerpt: '', category: '', tags: '', featuredImage: '', images: [],
    status: 'draft', isBreaking: false, breakingSuggested: false, isTrending: false,
    trendingSuggested: false, isFeatured: false, authorName: 'Admin',
    source: '', sourceUrl: '', seoTitle: '', seoDescription: '', seoKeywords: '', scheduledAt: '',
  });

  const [categoryForm, setCategoryForm] = useState({
    name: '', slug: '', description: '', color: '#3B82F6', order: 0, isActive: true,
  });

  const [userForm, setUserForm] = useState({
    name: '', email: '', role: 'reporter', isVerified: false, bio: '',
    canPublishScheduled: false, canPublishBreaking: false,
  });

  const [ytForm, setYtForm] = useState({ videoId: '', channelId: '', title: '', isLive: false });
  const [ytSaving, setYtSaving] = useState(false);

  // ── New UI State ──
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Responsive sidebar
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

  // ── Code 1: Auth helpers ──
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

  // ── Code 1: Auth check ──
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

  // ── Code 1: Fetch functions ──
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

  // ── Code 1: Initial load ──
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchCategories()]);
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

  // ── Code 1: YouTube ──
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

  // ── Code 1: News CRUD ──
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

  const handleApproveNews = async (id) => { await handleWorkflowAction(id, 'approve'); };
  const handleRejectNews = async (id, comment) => { await handleWorkflowAction(id, 'revise', comment || 'Needs revision'); };

  const resetNewsForm = () => {
    setNewsForm({
      title: '', content: '', excerpt: '', category: '', tags: '', featuredImage: '', images: [],
      status: 'draft', isBreaking: false, breakingSuggested: false, isTrending: false,
      trendingSuggested: false, isFeatured: false, authorName: currentUser?.name || 'Admin',
      source: '', sourceUrl: '', seoTitle: '', seoDescription: '', seoKeywords: '', scheduledAt: '',
    });
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

  // ── Code 1: Category CRUD ──
  const handleSaveCategory = async () => {
    try {
      const method = editingCategory ? 'PUT' : 'POST';
      const url = editingCategory ? `/api/admin/categories/${editingCategory.id}` : '/api/admin/categories';
      const res = await authFetch(url, { method, body: JSON.stringify(categoryForm) });
      if (!res.ok) throw new Error('Failed to save');
      toast.success(editingCategory ? 'Category updated' : 'Category created');
      setIsCategoryDialogOpen(false);
      setCategoryForm({ name: '', slug: '', description: '', color: '#3B82F6', order: 0, isActive: true });
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

  // ── Code 1: User CRUD ──
  const handleSaveUser = async () => {
    try {
      const method = editingUser ? 'PUT' : 'POST';
      const url = editingUser ? `/api/admin/users/${editingUser.id}` : '/api/admin/users';
      const res = await authFetch(url, { method, body: JSON.stringify(userForm) });
      if (!res.ok) throw new Error('Failed to save');
      toast.success(editingUser ? 'User updated' : 'User created');
      setIsUserDialogOpen(false);
      setUserForm({ name: '', email: '', role: 'reporter', isVerified: false, bio: '', canPublishScheduled: false, canPublishBreaking: false });
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

  // ── Code 1: Format date ──
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  // ── Render active view ──
  const renderView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView analytics={analytics} loading={loading} />;
      case 'news':
        return (
          <NewsListView
            news={news} categories={categories} currentUser={currentUser}
            newsStatusFilter={newsStatusFilter} onStatusFilterChange={setNewsStatusFilter}
            searchQuery={searchQuery} loading={loading}
            onEdit={openEditNews} onDelete={handleDeleteNews}
            onWorkflow={handleWorkflowAction} onAddNew={() => { resetNewsForm(); setIsNewsDialogOpen(true); }}
            onViewVersionHistory={handleViewVersionHistory}
          />
        );
      case 'categories':
        return (
          <CategoriesView categories={categories} loading={loading}
            onAdd={() => { setEditingCategory(null); setCategoryForm({ name: '', slug: '', description: '', color: '#3B82F6', order: 0, isActive: true }); setIsCategoryDialogOpen(true); }}
            onEdit={(cat) => { setEditingCategory(cat); setCategoryForm({ name: cat.name, slug: cat.slug, description: cat.description || '', color: cat.color, order: cat.order, isActive: cat.isActive }); setIsCategoryDialogOpen(true); }}
            onDelete={handleDeleteCategory}
          />
        );
      case 'users':
        return (
          <UsersView users={users} loading={loading} formatDate={formatDate}
            onAdd={() => { setEditingUser(null); setUserForm({ name: '', email: '', role: 'reporter', isVerified: false, bio: '', canPublishScheduled: false, canPublishBreaking: false }); setIsUserDialogOpen(true); }}
            onEdit={(user) => { setEditingUser(user); setUserForm({ name: user.name, email: user.email || '', role: user.role, isVerified: user.isVerified, bio: user.bio || '', canPublishScheduled: user.permissions?.canPublishScheduled || false, canPublishBreaking: user.permissions?.canPublishBreaking || false }); setIsUserDialogOpen(true); }}
            onDelete={handleDeleteUser}
          />
        );
      case 'livestream':
        return <LiveStreamView ytForm={ytForm} setYtForm={setYtForm} onSave={saveYtConfig} onClear={clearYtConfig} ytSaving={ytSaving} />;
      default:
        return null;
    }
  };

  const showSidebarDesktop = !isMobile;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'DM Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>
      {/* <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');
        *{box-sizing:border-box}
        input,textarea,select,button{font-family:inherit}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        ::-webkit-scrollbar{width:5px;height:5px}
        ::-webkit-scrollbar-track{background:#f1f1f1}
        ::-webkit-scrollbar-thumb{background:#d1d5db;border-radius:3px}
        @media(max-width:768px){
          .db-sidebar{transform:translateX(-230px)}
          .db-sidebar.open{transform:translateX(0)}
        }
      `}</style> */}

      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab} onTabChange={setActiveTab}
        currentUser={currentUser} isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)} isMobile={isMobile}
      />

      {/* Main */}
      <div style={DS.main(showSidebarDesktop)}>
        <Header
          currentUser={currentUser} onLogout={handleLogout}
          searchQuery={searchQuery} onSearchChange={(q) => { setSearchQuery(q); if (activeTab !== 'news') setActiveTab('news'); }}
          onToggleSidebar={() => setSidebarOpen(o => !o)}
          activeTab={activeTab}
        />
        <div style={{ flex: 1 }}>
          <div style={{ height: '100%', overflowY: 'auto' }}>
            {renderView()}
          </div>
        </div>
      </div>

      {/* ── Code 1: News Dialog (preserved exactly) ── */}
      <Dialog open={isNewsDialogOpen} onOpenChange={setIsNewsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingNews ? 'Edit Article' : 'Create Article'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Section 1: Main Info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <div style={DS.sectionNum}>1</div>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>Main Information</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input value={newsForm.title} onChange={e => setNewsForm({ ...newsForm, title: e.target.value })} placeholder="Article title" />
              </div>
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select value={newsForm.category} onValueChange={v => setNewsForm({ ...newsForm, category: v })}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => <SelectItem key={cat.id} value={cat.slug}>{cat.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Section 2: Content */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <div style={DS.sectionNum}>2</div>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>Description</span>
            </div>
            {/* <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ padding: '8px 12px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                {[Bold, Italic, Underline, Type, AlignLeft, AlignCenter, AlignRight, List, Link, ImageIcon, Smile].map((Icon, i) => (
                  <button key={i} style={{ width: 28, height: 28, border: 'none', borderRadius: 6, background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f3f4f6'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <Icon size={13} />
                  </button>
                ))}
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 2 }}>
                  {[Undo, Redo, MoreHorizontal].map((Icon, i) => (
                    <button key={i} style={{ width: 28, height: 28, border: 'none', borderRadius: 6, background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f3f4f6'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <Icon size={13} />
                    </button>
                  ))}
                </div>
              </div>
              
              <Textarea value={newsForm.content} onChange={e => setNewsForm({ ...newsForm, content: e.target.value })}
                placeholder="Article content..." rows={8}
                style={{ border: 'none', borderRadius: 0, resize: 'vertical', outline: 'none', boxShadow: 'none' }} />
            </div> */}

            <div style={{ border: '1px solid #e5e7eb',
              borderRadius: '10px',
              overflow: 'hidden',
              background: '#fff' }}>

              <ReactQuill
                value={newsForm.content}
                onChange={(value) => setNewsForm({ ...newsForm, content: value })}
                placeholder="Article content..." 
                style={{ height: '250px' }}
                modules={{
                  toolbar: [
                    ['bold', 'italic', 'underline'],               // B I U
                    [{ size: ['small', false, 'large', 'huge'] }], // TEXT SIZE ✅
                    [{ align: [] }],                               // ALIGNMENT ✅ (same line)
                    [{ list: 'ordered' }, { list: 'bullet' }],     // LIST
                    ['link', 'image'],                             // LINKS + IMAGE                            
                    ['clean']                                      // CLEAR FORMAT
                  ],
                  history: {
                    delay: 1000,
                    maxStack: 50,
                    userOnly: true
                  }
                }}
                formats={[
                  'bold', 'italic', 'underline',
                  'size', 'align',
                  'list', 'bullet',
                  'link', 'image', 'clean'
                ]}
              />

            </div>

            <div className="space-y-2">
              <Label>Excerpt</Label>
              <Textarea value={newsForm.excerpt} onChange={e => setNewsForm({ ...newsForm, excerpt: e.target.value })}
                placeholder="Brief summary (auto-generated if empty)" rows={2} />
            </div>

            {/* Section 3: Images */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <div style={DS.sectionNum}>3</div>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>Images</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Featured Image</Label>
                <ImageUpload
                  value={newsForm.featuredImage}
                  onChange={url => setNewsForm({ ...newsForm, featuredImage: url })}
                />
              </div>

              <div className="space-y-2">
                <Label>Gallery Images</Label>

                <MultiImageUpload
                  images={newsForm.images}
                  onChange={(imgs) => setNewsForm({ ...newsForm, images: imgs })}
                />
              </div>
              <div className="space-y-2">
                <Label>Tags (comma separated)</Label>
                <Input value={newsForm.tags} onChange={e => setNewsForm({ ...newsForm, tags: e.target.value })} placeholder="politics, breaking, economy" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={newsForm.status} onValueChange={v => setNewsForm({ ...newsForm, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(statusOptionsByRole[currentUser?.role] || statusOptionsByRole.admin).map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Author Name</Label>
                <Input value={newsForm.authorName} onChange={e => setNewsForm({ ...newsForm, authorName: e.target.value })} />
              </div>
              {newsForm.status === 'scheduled' && (
                <div className="space-y-2">
                  <Label>Schedule Date</Label>
                  <Input type="datetime-local" value={newsForm.scheduledAt} onChange={e => setNewsForm({ ...newsForm, scheduledAt: e.target.value })} />
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-6">
              {currentUser?.role === 'admin' && (
                <div className="flex items-center gap-2">
                  <Switch checked={newsForm.isBreaking} onCheckedChange={v => setNewsForm({ ...newsForm, isBreaking: v })} />
                  <Label>Breaking News</Label>
                </div>
              )}
              {(currentUser?.role === 'reporter' || currentUser?.role === 'editor') && (
                <div className="flex items-center gap-2">
                  <Switch checked={newsForm.breakingSuggested} onCheckedChange={v => setNewsForm({ ...newsForm, breakingSuggested: v })} />
                  <Label>Suggest Breaking News</Label>
                </div>
              )}
              {currentUser?.role !== 'reporter' && (
                <div className="flex items-center gap-2">
                  <Switch checked={newsForm.isTrending} onCheckedChange={v => setNewsForm({ ...newsForm, isTrending: v })} />
                  <Label>Trending</Label>
                </div>
              )}
              {currentUser?.role === 'reporter' && (
                <div className="flex items-center gap-2">
                  <Switch checked={newsForm.trendingSuggested} onCheckedChange={v => setNewsForm({ ...newsForm, trendingSuggested: v })} />
                  <Label>Suggest Trending</Label>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Switch checked={newsForm.isFeatured} onCheckedChange={v => setNewsForm({ ...newsForm, isFeatured: v })} />
                <Label>Featured Article</Label>
              </div>
            </div>

            <Separator />
            <h4 className="font-semibold">Source Attribution</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Source Name</Label>
                <Input value={newsForm.source} onChange={e => setNewsForm({ ...newsForm, source: e.target.value })} placeholder="Reuters, AP, etc." />
              </div>
              <div className="space-y-2">
                <Label>Source URL</Label>
                <Input value={newsForm.sourceUrl} onChange={e => setNewsForm({ ...newsForm, sourceUrl: e.target.value })} placeholder="https://..." />
              </div>
            </div>

            <Separator />
            <h4 className="font-semibold">SEO Settings</h4>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>SEO Title</Label>
                <Input value={newsForm.seoTitle} onChange={e => setNewsForm({ ...newsForm, seoTitle: e.target.value })} placeholder="SEO optimized title (defaults to article title)" />
              </div>
              <div className="space-y-2">
                <Label>SEO Description</Label>
                <Textarea value={newsForm.seoDescription} onChange={e => setNewsForm({ ...newsForm, seoDescription: e.target.value })} placeholder="Meta description for search engines" rows={2} />
              </div>
              <div className="space-y-2">
                <Label>SEO Keywords (comma separated)</Label>
                <Input value={newsForm.seoKeywords} onChange={e => setNewsForm({ ...newsForm, seoKeywords: e.target.value })} placeholder="keyword1, keyword2, keyword3" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveNews} disabled={!newsForm.title || !newsForm.content || !newsForm.category}>
              {editingNews ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Code 1: Category Dialog (preserved exactly) ── */}
      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? 'Edit Category' : 'Create Category'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input value={categoryForm.name}
                onChange={e => setCategoryForm({ ...categoryForm, name: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-') })}
                placeholder="Category name" />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input value={categoryForm.slug} onChange={e => setCategoryForm({ ...categoryForm, slug: e.target.value })} placeholder="category-slug" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={categoryForm.description} onChange={e => setCategoryForm({ ...categoryForm, description: e.target.value })} placeholder="Category description" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex gap-2">
                  <Input type="color" value={categoryForm.color} onChange={e => setCategoryForm({ ...categoryForm, color: e.target.value })} className="w-12 h-10 p-1" />
                  <Input value={categoryForm.color} onChange={e => setCategoryForm({ ...categoryForm, color: e.target.value })} className="flex-1" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Order</Label>
                <Input type="number" value={categoryForm.order} onChange={e => setCategoryForm({ ...categoryForm, order: parseInt(e.target.value) || 0 })} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={categoryForm.isActive} onCheckedChange={v => setCategoryForm({ ...categoryForm, isActive: v })} />
              <Label>Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCategoryDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveCategory} disabled={!categoryForm.name}>{editingCategory ? 'Update' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Code 1: Version History Dialog (preserved exactly) ── */}
      <Dialog open={isVersionHistoryOpen} onOpenChange={setIsVersionHistoryOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto z-[9999]">
          <DialogHeader><DialogTitle>Version History</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {versionHistory.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No version history available</p>
            ) : (
              <div className="space-y-4">
                {versionHistory.map((version, index) => (
                  <div key={index} style={{ ...DS.card, padding: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                      <div>
                        <span style={{ ...DS.tag, border: '1px solid #e5e7eb', marginBottom: 6, display: 'inline-block' }}>Version {version.version || index + 1}</span>
                        <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>{formatDate(version.timestamp)}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: 13, fontWeight: 500, color: '#374151', margin: '0 0 4px' }}>{version.authorName || 'Unknown'}</p>
                        <span style={DS.badge(version.status)}>
                          {version.status?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      </div>
                    </div>
                    <h4 style={{ fontSize: 14, fontWeight: 600, color: '#111827', margin: '0 0 4px' }}>{version.title}</h4>
                    <p style={{ fontSize: 13, color: '#6b7280', margin: 0, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{version.content}</p>
                    {version.corrections && version.corrections.length > 0 && (
                      <div style={{ marginTop: 8 }}>
                        <p style={{ fontSize: 12, fontWeight: 600, color: '#ea580c', margin: '0 0 4px' }}>Corrections:</p>
                        <ul style={{ fontSize: 12, color: '#6b7280', paddingLeft: 16, margin: 0 }}>
                          {version.corrections.map((c, idx) => <li key={idx}>{c}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Code 1: User Dialog (preserved exactly) ── */}
      <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Edit User' : 'Create User'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input value={userForm.name} onChange={e => setUserForm({ ...userForm, name: e.target.value })} placeholder="Full name" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={userForm.email} onChange={e => setUserForm({ ...userForm, email: e.target.value })} placeholder="email@example.com" />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={userForm.role} onValueChange={v => setUserForm({ ...userForm, role: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
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
              <Textarea value={userForm.bio} onChange={e => setUserForm({ ...userForm, bio: e.target.value })} placeholder="User bio" />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={userForm.isVerified} onCheckedChange={v => setUserForm({ ...userForm, isVerified: v })} />
              <Label>Verified Author</Label>
            </div>
            {userForm.role === 'editor' && (
              <>
                <Separator />
                <h4 className="font-semibold">Editor Permissions</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Switch checked={userForm.canPublishScheduled} onCheckedChange={v => setUserForm({ ...userForm, canPublishScheduled: v })} />
                    <Label>Can publish scheduled news</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={userForm.canPublishBreaking} onCheckedChange={v => setUserForm({ ...userForm, canPublishBreaking: v })} />
                    <Label>Can publish breaking news</Label>
                  </div>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUserDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveUser} disabled={!userForm.name}>{editingUser ? 'Update' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}