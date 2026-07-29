'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DS } from './design-system';
import { getVersionDisplayStatus, getVersionSummary } from '@/lib/admin/versionHistory';

export function VersionHistoryDialog({ open, onOpenChange, versionHistory, formatDate, onSelectVersion, selectedVersion, loading }) {
  const [activeVersion, setActiveVersion] = useState(null);

  useEffect(() => {
    if (!open) {
      setActiveVersion(null);
      return;
    }

    if (selectedVersion) {
      setActiveVersion(selectedVersion);
      return;
    }

    if (versionHistory?.length) {
      setActiveVersion(versionHistory[0]);
    }
  }, [open, selectedVersion, versionHistory]);

  const summary = useMemo(() => {
    if (!activeVersion) return null;
    return getVersionSummary(activeVersion, activeVersion.version ? activeVersion.version - 1 : 0);
  }, [activeVersion]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto z-[9999]">
        <DialogHeader><DialogTitle>Version History</DialogTitle></DialogHeader>
        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 size={24} className="animate-spin text-blue-600" />
            </div>
          ) : versionHistory.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No version history available</p>
          ) : (
            <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
              <div className="space-y-2">
                {versionHistory.map((version, index) => {
                  const info = getVersionSummary(version, index);
                  return (
                    <button
                      key={version.id || `${version.editedAt || index}-${index}`}
                      type="button"
                      onClick={() => onSelectVersion?.(version)}
                      style={{
                        ...DS.card,
                        padding: 12,
                        width: '100%',
                        textAlign: 'left',
                        border: activeVersion?.id === version.id ? '1px solid #2563eb' : '1px solid #e5e7eb',
                        background: activeVersion?.id === version.id ? '#eff6ff' : '#fff',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ ...DS.tag, border: '1px solid #e5e7eb', display: 'inline-block' }}>{info.versionLabel}</span>
                        <span style={DS.badge(version.status)}>{getVersionDisplayStatus(version.status)}</span>
                      </div>
                      <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 4px' }}>{formatDate(version.editedAt)}</p>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', margin: 0 }}>{version.title}</p>
                    </button>
                  );
                })}
              </div>
              <div style={{ ...DS.card, padding: 16 }}>
                {summary ? (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <div>
                        <h4 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: 0 }}>{summary.title}</h4>
                        <p style={{ fontSize: 12, color: '#6b7280', margin: '4px 0 0' }}>{summary.versionLabel}</p>
                      </div>
                      <span style={DS.badge(activeVersion?.status)}>{summary.displayStatus}</span>
                    </div>
                    <div style={{ display: 'grid', gap: 8, marginBottom: 12 }}>
                      <div><strong style={{ color: '#374151' }}>Edited by:</strong> {activeVersion?.editedByName || 'Unknown'}</div>
                      <div><strong style={{ color: '#374151' }}>Edited at:</strong> {formatDate(activeVersion?.editedAt)}</div>
                      <div><strong style={{ color: '#374151' }}>Content:</strong></div>
                      <div style={{ whiteSpace: 'pre-wrap', background: '#f9fafb', borderRadius: 8, padding: 12, color: '#111827', minHeight: 160 }}>
                        {activeVersion?.content || 'No content available'}
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-center text-muted-foreground py-8">Select a version to preview the article snapshot.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
