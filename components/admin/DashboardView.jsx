'use client';

import { Loader2, FileText, CheckCircle, Clock, Eye, TrendingUp } from 'lucide-react';
import { LineChart, Line, BarChart as RBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DS } from './design-system';

const DEFAULT_CHART_DATA = [
  { name: 'Jan', views: 10, articles: 50 }, { name: 'Feb', views: 30, articles: 60 },
  { name: 'Mar', views: 20, articles: 70 }, { name: 'Apr', views: 25, articles: 50 },
  { name: 'May', views: 16, articles: 65 }, { name: 'Jun', views: 12, articles: 45 },
];

export function DashboardView({ analytics, loading }) {
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 300 }}>
        <Loader2 size={50} style={{ animation: 'spin 1s linear infinite', color: '#2563eb' }} />
      </div>
    );
  }
  if (!analytics) return null;

  const chartData = analytics.chartData || DEFAULT_CHART_DATA;

  const stats = [
    { label: 'Total Articles', value: analytics.stats?.totalNews || 0, icon: FileText, color: '#2563eb', bg: '#eff6ff' },
    { label: 'Published', value: analytics.stats?.publishedNews || 0, icon: CheckCircle, color: '#059669', bg: '#f0fdf4' },
    { label: 'Pending Review', value: (analytics.stats?.draftNews || 0) + (analytics.stats?.pendingReviewNews || 0) + (analytics.stats?.needsRevisionNews || 0), icon: Clock, color: '#d97706', bg: '#fffbeb' },
    { label: 'Total Views', value: (analytics.stats?.totalViews || 0).toLocaleString(), icon: Eye, color: '#7c3aed', bg: '#faf5ff' },
  ];

  return (
    <div style={{ padding: 24 }}>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16, marginBottom: 24 }}>
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
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
