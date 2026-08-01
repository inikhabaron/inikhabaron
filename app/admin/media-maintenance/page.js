'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { RefreshCw, Trash2, ShieldAlert, ArrowLeft, FileWarning } from 'lucide-react';

import { DS } from '@/components/admin/design-system';
import { LoadingSpinner } from '@/components/admin/LoadingSpinner';

// Maintenance console for Cloudinary storage.
//
// Scan-only by default: nothing on this page deletes anything until an admin
// selects specific assets AND types the confirmation word. Only assets the
// server classified as `orphaned` are ever selectable, and the server checks
// that again before destroying anything — this UI is not the gate.

const CONFIRMATION = 'DELETE';

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function formatDate(ms) {
  if (!ms) return '—';
  return new Date(ms).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

const STATUS_STYLE = {
  referenced: { color: '#065f46', bg: '#d1fae5', label: 'In use' },
  orphaned: { color: '#991b1b', bg: '#fee2e2', label: 'Unused' },
  unknown: { color: '#92400e', bg: '#fef3c7', label: 'Unknown' },
};

function StatusBadge({ status }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE.unknown;
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20,
      color: s.color, background: s.bg, whiteSpace: 'nowrap',
    }}>{s.label}</span>
  );
}

function SummaryCard({ label, value, sub, accent }) {
  return (
    <div style={{ ...DS.card, padding: 16, flex: '1 1 160px', minWidth: 160 }}>
      <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 800, color: accent || '#111827' }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

export default function MediaMaintenancePage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(null); // null = checking
  const [report, setReport] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [selected, setSelected] = useState(() => new Set());
  const [filter, setFilter] = useState('orphaned');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

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

  // Admin-only. The API enforces this independently; this check only avoids
  // showing a console to someone who cannot use it.
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

  const runScan = useCallback(async () => {
    setScanning(true);
    setSelected(new Set());
    try {
      const res = await authFetch('/api/admin/media-maintenance/scan');
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `Scan failed (${res.status})`);
      setReport(data);
      toast.success(`Scanned ${data.summary.totalAssets} assets`);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setScanning(false);
    }
  }, [authFetch]);

  const items = report?.items || [];
  const visible = useMemo(
    () => (filter === 'all' ? items : items.filter((i) => i.status === filter)),
    [items, filter],
  );

  // Only orphans are ever selectable — an "in use" or "unknown" row has no
  // checkbox at all, so there is no path from this table to deleting one.
  const selectableIds = useMemo(
    () => visible.filter((i) => i.status === 'orphaned').map((i) => i.publicId),
    [visible],
  );

  const toggle = (publicId) => setSelected((prev) => {
    const next = new Set(prev);
    if (next.has(publicId)) next.delete(publicId); else next.add(publicId);
    return next;
  });

  const toggleAll = () => setSelected((prev) => (
    selectableIds.every((id) => prev.has(id)) ? new Set() : new Set(selectableIds)
  ));

  const selectedItems = items.filter((i) => selected.has(i.publicId));
  const selectedBytes = selectedItems.reduce((n, i) => n + (i.bytes || 0), 0);

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      const res = await authFetch('/api/admin/media-maintenance/delete', {
        method: 'POST',
        body: JSON.stringify({ publicIds: [...selected], confirmation: CONFIRMATION }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `Delete failed (${res.status})`);

      const parts = [`${data.deleted.length} deleted`];
      if (data.refused.length) parts.push(`${data.refused.length} refused`);
      if (data.failed.length) parts.push(`${data.failed.length} failed`);
      toast.success(parts.join(' · '));

      // Refused assets are the interesting case: something referenced them
      // between the scan and the confirmation, so say which and why.
      for (const r of data.refused.slice(0, 3)) toast.warning(`Kept ${r.publicId}: ${r.reason}`);

      setDialogOpen(false);
      setConfirmText('');
      await runScan();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setDeleting(false);
    }
  };

  if (authorized === null) return <LoadingSpinner />;
  if (authorized === false) {
    return (
      <div style={{ padding: 48, textAlign: 'center', fontFamily: "'DM Sans', sans-serif" }}>
        <ShieldAlert size={40} color="#dc2626" style={{ marginBottom: 12 }} />
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>Administrators only</h1>
        <p style={{ color: '#6b7280', fontSize: 14 }}>Media maintenance is restricted to admin accounts.</p>
      </div>
    );
  }

  const s = report?.summary;

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ ...DS.header }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button style={DS.btn('ghost')} onClick={() => router.push('/admin')}><ArrowLeft size={16} /></button>
          <h1 style={{ fontSize: 17, fontWeight: 700, color: '#111827', margin: 0 }}>Media Maintenance</h1>
        </div>
        <button style={DS.btn('primary')} onClick={runScan} disabled={scanning}>
          <RefreshCw size={15} style={scanning ? { animation: 'spin 1s linear infinite' } : undefined} />
          {scanning ? 'Scanning…' : report ? 'Re-scan' : 'Run scan'}
        </button>
      </div>

      <div style={{ padding: 24 }}>
        <div style={{
          ...DS.card, padding: 14, marginBottom: 20, display: 'flex', gap: 10,
          alignItems: 'flex-start', background: '#eff6ff', borderColor: '#bfdbfe',
        }}>
          <FileWarning size={17} color="#1d4ed8" style={{ flexShrink: 0, marginTop: 1 }} />
          <div style={{ fontSize: 13, color: '#1e40af', lineHeight: 1.6 }}>
            <strong>Scan only.</strong> Nothing is deleted automatically. Assets are listed as
            unused only when no database reference exists, the URL parsed successfully, and the
            file is more than 24 hours old. Anything uncertain is marked <em>Unknown</em> and
            cannot be selected. Deletion is permanent and cannot be undone.
          </div>
        </div>

        {!report && !scanning && (
          <div style={{ ...DS.card, padding: 48, textAlign: 'center', color: '#6b7280' }}>
            Run a scan to inspect Cloudinary storage. This reads only — no assets are modified.
          </div>
        )}

        {scanning && !report && <LoadingSpinner />}

        {report && (
          <>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
              <SummaryCard label="Total assets" value={s.totalAssets} sub={formatBytes(s.totalBytes)} />
              <SummaryCard label="In use" value={s.referenced} accent="#059669" />
              <SummaryCard label="Unused" value={s.orphaned} accent="#dc2626" sub={`${formatBytes(s.recoverableBytes)} recoverable`} />
              <SummaryCard label="Unknown" value={s.unknown} accent="#d97706" sub="Not deletable" />
            </div>

            {s.unparseableReferences > 0 && (
              <div style={{ ...DS.card, padding: 12, marginBottom: 16, background: '#fffbeb', borderColor: '#fde68a', fontSize: 13, color: '#92400e' }}>
                {s.unparseableReferences} stored URL(s) point at Cloudinary but could not be parsed.
                Any asset they might refer to has been marked Unknown rather than unused.
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
              {['orphaned', 'unknown', 'referenced', 'all'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  style={{
                    ...DS.btn(filter === f ? 'primary' : 'outline'),
                    padding: '6px 14px', fontSize: 13, textTransform: 'capitalize',
                  }}
                >
                  {f === 'orphaned' ? 'Unused' : f === 'referenced' ? 'In use' : f}
                  {' '}({f === 'all' ? items.length : items.filter((i) => i.status === f).length})
                </button>
              ))}
              <div style={{ flex: 1 }} />
              {selected.size > 0 && (
                <button style={{ ...DS.btn('danger') }} onClick={() => setDialogOpen(true)}>
                  <Trash2 size={15} />
                  Delete {selected.size} selected ({formatBytes(selectedBytes)})
                </button>
              )}
            </div>

            <div style={{ ...DS.card, overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 980 }}>
                <thead>
                  <tr style={{ background: '#f9fafb', borderBottom: '1px solid #f3f4f6' }}>
                    <th style={{ padding: '10px 12px', width: 36 }}>
                      {selectableIds.length > 0 && (
                        <input
                          type="checkbox"
                          checked={selectableIds.every((id) => selected.has(id))}
                          onChange={toggleAll}
                          aria-label="Select all unused assets"
                        />
                      )}
                    </th>
                    {['Preview', 'Type', 'Folder', 'Public ID', 'Size', 'Created', 'Status', 'Reference locations'].map((h) => (
                      <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6b7280', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visible.map((item) => (
                    <tr key={`${item.resourceType}:${item.publicId}`} style={{ borderBottom: '1px solid #f9fafb' }}>
                      <td style={{ padding: '10px 12px' }}>
                        {item.status === 'orphaned' ? (
                          <input
                            type="checkbox"
                            checked={selected.has(item.publicId)}
                            onChange={() => toggle(item.publicId)}
                            aria-label={`Select ${item.publicId}`}
                          />
                        ) : (
                          <span title="Only unused assets can be selected" style={{ color: '#d1d5db' }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: '8px 12px' }}>
                        {item.resourceType === 'image' && item.url ? (
                          <img src={item.url} alt="" loading="lazy" style={{ width: 46, height: 46, objectFit: 'cover', borderRadius: 6, border: '1px solid #e5e7eb', background: '#f3f4f6' }} />
                        ) : (
                          <div style={{ width: 46, height: 46, borderRadius: 6, background: '#f3f4f6', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#6b7280' }}>
                            {item.resourceType === 'video' ? 'VIDEO' : '—'}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '10px 12px', fontSize: 12, color: '#6b7280' }}>{item.resourceType}</td>
                      <td style={{ padding: '10px 12px', fontSize: 12, color: '#6b7280' }}>{item.folder}</td>
                      <td style={{ padding: '10px 12px', fontSize: 12, color: '#111827', fontFamily: 'monospace', wordBreak: 'break-all', maxWidth: 220 }}>{item.publicId}</td>
                      <td style={{ padding: '10px 12px', fontSize: 12, color: '#6b7280', whiteSpace: 'nowrap' }}>{formatBytes(item.bytes)}</td>
                      <td style={{ padding: '10px 12px', fontSize: 12, color: '#6b7280', whiteSpace: 'nowrap' }}>{formatDate(item.createdAt)}</td>
                      <td style={{ padding: '10px 12px' }}><StatusBadge status={item.status} /></td>
                      <td style={{ padding: '10px 12px', fontSize: 12, color: '#374151', maxWidth: 300 }}>
                        {item.references?.length ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            {item.references.slice(0, 4).map((r, i) => (
                              <span key={i}>
                                <strong>{r.label}</strong>{' '}
                                <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#6b7280' }}>{r.field}</span>
                                {r.title ? <span style={{ color: '#9ca3af' }}> — {String(r.title).slice(0, 40)}</span> : null}
                              </span>
                            ))}
                            {item.references.length > 4 && (
                              <span style={{ color: '#6b7280' }}>+{item.references.length - 4} more</span>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: '#9ca3af' }}>{item.reason || 'No references found'}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {visible.length === 0 && (
                    <tr><td colSpan={9} style={{ padding: 44, textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>No assets in this view</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {dialogOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000, padding: 16 }}
          onClick={() => !deleting && setDialogOpen(false)}
        >
          <div style={{ background: '#fff', borderRadius: 14, padding: 24, width: 480, maxWidth: '100%' }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111827', margin: '0 0 10px' }}>
              Permanently delete {selected.size} Cloudinary asset{selected.size === 1 ? '' : 's'}?
            </h2>
            <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.6, margin: '0 0 6px' }}>
              This frees about <strong>{formatBytes(selectedBytes)}</strong>. <strong>This action cannot be undone.</strong>
            </p>
            <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6, margin: '0 0 14px' }}>
              Each asset is re-checked against the database immediately before deletion. Anything
              that has become referenced since the scan will be kept and reported back.
            </p>

            <div style={{ maxHeight: 130, overflowY: 'auto', border: '1px solid #f3f4f6', borderRadius: 8, padding: 10, marginBottom: 14 }}>
              {selectedItems.map((i) => (
                <div key={i.publicId} style={{ fontSize: 11, fontFamily: 'monospace', color: '#6b7280', wordBreak: 'break-all' }}>{i.publicId}</div>
              ))}
            </div>

            <label style={DS.label}>Type <strong>{CONFIRMATION}</strong> to enable deletion</label>
            <input
              style={DS.input}
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={CONFIRMATION}
              autoFocus
              disabled={deleting}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 18 }}>
              <button style={DS.btn('outline')} onClick={() => { setDialogOpen(false); setConfirmText(''); }} disabled={deleting}>
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={confirmText !== CONFIRMATION || deleting}
                style={{
                  ...DS.btn('primary'),
                  background: confirmText === CONFIRMATION && !deleting ? '#dc2626' : '#fca5a5',
                  cursor: confirmText === CONFIRMATION && !deleting ? 'pointer' : 'not-allowed',
                }}
              >
                <Trash2 size={15} />
                {deleting ? 'Deleting…' : `Delete ${selected.size}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
