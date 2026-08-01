'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, ShieldAlert, Save } from 'lucide-react';

import { DS } from '@/components/admin/design-system';
import { LoadingSpinner } from '@/components/admin/LoadingSpinner';
import { CRICKET_TIER_LIST } from '@/lib/cricket/matchPriority';

const TIER_LABEL = {
  ipl: 'IPL',
  india: 'India matches',
  icc: 'ICC tournaments',
  international: 'Other internationals',
  domestic: 'Domestic leagues',
};

// Admin config for the Live Cricket Score Center. No manual score editing
// here — this only controls whether/how the module surfaces on the site
// (mirrors the scope note in the original spec: "No manual score editing").
export default function CricketSettingsPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(null);
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);

  const authFetch = useCallback((url, options = {}) => {
    const token = localStorage.getItem('admin_token')?.toString().trim();
    return fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}`, 'x-admin-token': token } : {}),
        ...(options.headers || {}),
      },
    });
  }, []);

  useEffect(() => {
    const session = localStorage.getItem('admin_session');
    const token = localStorage.getItem('admin_token');
    if (!token || !session) { router.replace('/admin/login'); return; }
    try {
      const role = JSON.parse(session)?.role?.toString().trim().toLowerCase();
      if (role !== 'admin') { setAuthorized(false); return; }
      setAuthorized(true);
    } catch { setAuthorized(false); }
  }, [router]);

  useEffect(() => {
    if (authorized !== true) return;
    authFetch('/api/admin/settings/cricket')
      .then((res) => res.json())
      .then((data) => { if (data.success) setSettings(data.settings); else toast.error(data.error || 'Failed to load settings'); })
      .catch(() => toast.error('Failed to load settings'));
  }, [authorized, authFetch]);

  const toggleTier = (tier) => {
    setSettings((prev) => {
      const current = new Set(prev.preferredLeagues || []);
      if (current.has(tier)) current.delete(tier); else current.add(tier);
      return { ...prev, preferredLeagues: CRICKET_TIER_LIST.filter((t) => current.has(t)) };
    });
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await authFetch('/api/admin/settings/cricket', { method: 'POST', body: JSON.stringify(settings) });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Save failed');
      setSettings(data.settings);
      toast.success('Cricket settings saved');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  if (authorized === null || (authorized && !settings)) return <LoadingSpinner />;
  if (authorized === false) {
    return (
      <div style={{ padding: 48, textAlign: 'center', fontFamily: "'DM Sans', sans-serif" }}>
        <ShieldAlert size={40} color="#dc2626" style={{ marginBottom: 12 }} />
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>Administrators only</h1>
        <p style={{ color: '#6b7280', fontSize: 14 }}>Cricket settings are restricted to admin accounts.</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ ...DS.header }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button style={DS.btn('ghost')} onClick={() => router.push('/admin')}><ArrowLeft size={16} /></button>
          <h1 style={{ fontSize: 17, fontWeight: 700, color: '#111827', margin: 0 }}>Cricket Settings</h1>
        </div>
        <button style={DS.btn('primary')} onClick={save} disabled={saving}>
          <Save size={15} />
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>

      <div style={{ padding: 24, maxWidth: 640 }}>
        <div style={{ ...DS.card, padding: 20, marginBottom: 16 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: 14 }}>
            <input type="checkbox" checked={!!settings.enabled} onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })} />
            <span style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>Enable Cricket module</span>
          </label>
          <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 14px 26px' }}>
            Turns off /cricket, the homepage widget, and match pages site-wide when unchecked.
          </p>

          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: 6 }}>
            <input type="checkbox" checked={!!settings.homepageWidgetEnabled} onChange={(e) => setSettings({ ...settings, homepageWidgetEnabled: e.target.checked })} disabled={!settings.enabled} />
            <span style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>Show homepage widget</span>
          </label>
          <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 14px 26px' }}>
            Only shows when a match is actually live — this just controls whether it's allowed to.
          </p>

          <label style={DS.label}>Homepage widget size</label>
          <select
            style={{ ...DS.select, width: '100%', marginBottom: 4 }}
            value={settings.homepageWidgetSize || 'compact'}
            onChange={(e) => setSettings({ ...settings, homepageWidgetSize: e.target.value })}
            disabled={!settings.enabled || !settings.homepageWidgetEnabled}
          >
            <option value="compact">Compact (up to 2 matches)</option>
            <option value="expanded">Expanded (up to 3 matches, fuller card)</option>
          </select>
        </div>

        <div style={{ ...DS.card, padding: 20, marginBottom: 16 }}>
          <label style={DS.label}>Preferred leagues</label>
          <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 12px' }}>
            Only matches in a checked tier are shown on /cricket and the homepage widget, in this priority order.
          </p>
          {CRICKET_TIER_LIST.map((tier) => (
            <label key={tier} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: 8 }}>
              <input type="checkbox" checked={(settings.preferredLeagues || []).includes(tier)} onChange={() => toggleTier(tier)} />
              <span style={{ fontSize: 14, color: '#374151' }}>{TIER_LABEL[tier] || tier}</span>
            </label>
          ))}

          <label style={{ ...DS.label, marginTop: 14 }}>Featured tournament (optional)</label>
          <input
            style={DS.input}
            value={settings.featuredTournament || ''}
            onChange={(e) => setSettings({ ...settings, featuredTournament: e.target.value })}
            placeholder="e.g. IPL, World Cup — pins matching matches to the top"
          />
          <p style={{ fontSize: 12, color: '#6b7280', margin: '6px 0 0' }}>
            Matched against the match name and team names; matching matches are always shown, even if their
            tier is unchecked above.
          </p>
        </div>

        <div style={{ ...DS.card, padding: 20 }}>
          <label style={DS.label}>Refresh interval override (seconds)</label>
          <input
            style={DS.input}
            type="number"
            min={15}
            value={settings.refreshIntervalSeconds || ''}
            onChange={(e) => setSettings({ ...settings, refreshIntervalSeconds: e.target.value ? Number(e.target.value) : null })}
            placeholder="Leave blank for the built-in adaptive rate (60s live / 10min idle)"
          />
          <p style={{ fontSize: 12, color: '#6b7280', margin: '6px 0 0' }}>
            CricAPI meters credits per request — a lower interval means more upstream calls. Roughly
            86400 / interval requests per day per open tab, so 1800s ≈ 48/day and the blank adaptive rate
            ≈ 1440/day while a match is live. Leave blank <strong>only</strong> on a plan that can absorb
            per-minute polling — the free plan allows 100/day.
          </p>
        </div>
      </div>
    </div>
  );
}
