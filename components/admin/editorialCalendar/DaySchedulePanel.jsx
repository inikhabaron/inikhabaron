'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Plus, CalendarClock } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DS } from '@/components/admin/design-system';
import { STATUS_LABELS } from '@/components/admin/constants';
import { canCreateArticle, canPublishScheduled, canEditArticle } from '@/lib/auth/permissions';

const SECTIONS = [
  { key: 'schedule', title: 'Schedule', empty: 'No content scheduled for this date.' },
  { key: 'published', title: 'Published', empty: 'No articles published on this date.' },
  { key: 'updated', title: 'Updated', empty: 'No articles updated on this date.' },
  { key: 'breaking', title: 'Breaking News', empty: 'No breaking news on this date.' },
  { key: 'drafts', title: 'Drafts', empty: 'No drafts created on this date.' },
  { key: 'tasks', title: 'Tasks & Notifications', empty: 'No pending tasks or notifications.' },
];

const VERB_BY_TYPE = {
  scheduled: 'Scheduled', published: 'Published', updated: 'Updated',
  breaking: 'Breaking news added', draft: 'Created', tasks: null,
};

function formatTime(dateString) {
  return format(new Date(dateString), 'h:mm a');
}

function roleLabel(role) {
  if (!role) return null;
  return role.charAt(0).toUpperCase() + role.slice(1);
}

function ActivityItem({ item, currentUser }) {
  const router = useRouter();
  const verb = VERB_BY_TYPE[item.type] || item.extra?.label || 'Updated';
  const actorLine = item.actor?.name
    ? `${verb} by ${item.actor.name}${roleLabel(item.actor.role) ? ` — ${roleLabel(item.actor.role)}` : ''}`
    : verb;
  const canEdit = canEditArticle(currentUser, { status: item.status, authorId: item.authorId });

  return (
    <div style={{ display: 'flex', gap: 10, padding: '10px 0', borderBottom: '1px solid #f3f4f6' }}>
      <Avatar className="h-8 w-8 mt-0.5">
        <AvatarImage src={item.actor?.avatar || undefined} alt={item.actor?.name || ''} />
        <AvatarFallback style={{ fontSize: 12 }}>{item.actor?.name?.[0]?.toUpperCase() || '?'}</AvatarFallback>
      </Avatar>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</div>
          {canEdit && (
            <button
              onClick={() => router.push(`/admin?tab=news&openEdit=${item.articleId}`)}
              style={{ ...DS.btn('ghost'), padding: '2px 8px', fontSize: 11, flexShrink: 0 }}
            >
              Edit
            </button>
          )}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginTop: 4 }}>
          <span style={DS.badge(item.status)}>{STATUS_LABELS[item.status] || item.status}</span>
          {item.category && <span style={DS.tag}>{item.category}</span>}
          <span style={{ fontSize: 11, color: '#9ca3af' }}>{formatTime(item.time)}</span>
        </div>
        <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{actorLine}</div>
        {item.extra?.text && (
          <div style={{ fontSize: 12, color: '#374151', marginTop: 4, fontStyle: 'italic' }}>&ldquo;{item.extra.text}&rdquo;</div>
        )}
      </div>
    </div>
  );
}

function SectionBlock({ section, items, currentUser }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4 }}>
        {section.title} {items.length > 0 && <span style={{ color: '#9ca3af', fontWeight: 500 }}>({items.length})</span>}
      </div>
      {items.length === 0 ? (
        <div style={{ fontSize: 12, color: '#9ca3af', padding: '4px 0' }}>{section.empty}</div>
      ) : (
        items.map((item) => <ActivityItem key={item.id} item={item} currentUser={currentUser} />)
      )}
    </div>
  );
}

export function DaySchedulePanel({ open, onOpenChange, date, authFetch, filters, currentUser, onScheduleContent }) {
  const router = useRouter();
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !date) return;
    setLoading(true);
    const params = new URLSearchParams({ date });
    if (filters?.types?.length) params.set('type', filters.types.join(','));
    if (filters?.category) params.set('category', filters.category);
    if (filters?.role) params.set('role', filters.role);
    if (filters?.authorName) params.set('author', filters.authorName);

    authFetch(`/api/admin/calendar/day?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => setActivity(data?.data?.activity || null))
      .catch(() => toast.error('Failed to load day activity'))
      .finally(() => setLoading(false));
  }, [open, date, filters, authFetch]);

  const total = activity ? Object.values(activity.summary).reduce((sum, n) => sum + n, 0) : 0;
  const canSchedule = canPublishScheduled(currentUser, currentUser?.permissions);
  const canCreate = canCreateArticle(currentUser);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{date ? format(new Date(date), 'EEEE, MMMM d, yyyy') : 'Day Schedule'}</SheetTitle>
        </SheetHeader>

        {loading && <div style={{ padding: '40px 0', textAlign: 'center', color: '#6b7280', fontSize: 13 }}>Loading...</div>}

        {!loading && activity && (
          <>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, margin: '16px 0' }}>
              <div style={{ ...DS.tag, background: '#eff6ff', color: '#1d4ed8', fontWeight: 700 }}>{total} total</div>
              {Object.entries(activity.summary).filter(([, n]) => n > 0).map(([key, n]) => (
                <div key={key} style={DS.tag}>{n} {key}</div>
              ))}
            </div>

            {total === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 12px', color: '#6b7280' }}>
                <p style={{ fontSize: 13, marginBottom: 16 }}>No editorial activity scheduled for this date.</p>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                  {canSchedule && (
                    <Button size="sm" onClick={() => onScheduleContent(date)}>
                      <CalendarClock className="h-4 w-4 mr-1" /> Schedule Content
                    </Button>
                  )}
                  {canCreate && (
                    <Button size="sm" variant="outline" onClick={() => router.push('/admin?tab=news')}>
                      <Plus className="h-4 w-4 mr-1" /> Add Article
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              SECTIONS.map((section) => (
                <SectionBlock key={section.key} section={section} items={activity.sections[section.key] || []} currentUser={currentUser} />
              ))
            )}
          </>
        )}

        {!loading && activity && total > 0 && (canSchedule || canCreate) && (
          <div style={{ display: 'flex', gap: 8, borderTop: '1px solid #e5e7eb', paddingTop: 12, marginTop: 8, flexWrap: 'wrap' }}>
            {canSchedule && (
              <Button size="sm" onClick={() => onScheduleContent(date)}>
                <CalendarClock className="h-4 w-4 mr-1" /> Schedule Content
              </Button>
            )}
            {canCreate && (
              <Button size="sm" variant="outline" onClick={() => router.push('/admin?tab=news')}>
                <Plus className="h-4 w-4 mr-1" /> Add Article
              </Button>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
