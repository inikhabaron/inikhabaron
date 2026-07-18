'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DS } from './design-system';

export function VersionHistoryDialog({ open, onOpenChange, versionHistory, formatDate }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
                      <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>{formatDate(version.editedAt)}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: 13, fontWeight: 500, color: '#374151', margin: '0 0 4px' }}>{version.editedByName || 'Unknown'}</p>
                      <span style={DS.badge(version.status)}>
                        {version.status?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </div>
                  </div>
                  <h4 style={{ fontSize: 14, fontWeight: 600, color: '#111827', margin: 0 }}>{version.title}</h4>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
