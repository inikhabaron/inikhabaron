'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Plus, CalendarDays } from 'lucide-react';
import { toast } from 'sonner';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, addMonths, subMonths, format } from 'date-fns';
import { DS } from '@/components/admin/design-system';
import { LoadingSpinner } from '@/components/admin/LoadingSpinner';
import { canPublishScheduled } from '@/lib/auth/permissions';
import { CalendarGrid, DOT_CONFIG } from './CalendarGrid';
import { CalendarFilters } from './CalendarFilters';
import { ScheduleArticleModal } from './ScheduleArticleModal';
import { DaySchedulePanel } from './DaySchedulePanel';
import { MonthSummaryPanel } from './MonthSummaryPanel';

const navBtnStyle = {
  width: 36, height: 36, borderRadius: 10, border: '1px solid #e5e7eb', background: '#fff',
  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
  color: '#374151', boxShadow: '0 1px 2px rgba(15,23,42,0.04)', transition: 'all 0.15s ease',
};

const EMPTY_FILTERS = { types: [], category: null, role: null, authorName: null };

function filterParams(filters) {
  const params = new URLSearchParams();
  if (filters.types.length) params.set('type', filters.types.join(','));
  if (filters.category) params.set('category', filters.category);
  if (filters.role) params.set('role', filters.role);
  if (filters.authorName) params.set('author', filters.authorName);
  return params;
}

export function EditorialCalendarView({ authFetch, currentUser }) {
  const [monthCursor, setMonthCursor] = useState(() => startOfMonth(new Date()));
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [categories, setCategories] = useState([]);

  const [selectedDate, setSelectedDate] = useState(null);
  const [dayPanelOpen, setDayPanelOpen] = useState(false);

  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleDefaultDate, setScheduleDefaultDate] = useState(null);

  useEffect(() => {
    authFetch('/api/admin/categories')
      .then((res) => res.json())
      .then((data) => setCategories(data?.categories || []))
      .catch(() => {});
  }, [authFetch]);

  const fetchCounts = useCallback(async () => {
    setLoading(true);
    try {
      const start = startOfWeek(startOfMonth(monthCursor)).toISOString();
      const end = endOfWeek(endOfMonth(monthCursor)).toISOString();
      const params = filterParams(filters);
      params.set('start', start);
      params.set('end', end);
      const res = await authFetch(`/api/admin/calendar?${params.toString()}`);
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message || 'Failed to load calendar activity');
      setCounts(data?.data?.counts || {});
    } catch (error) {
      toast.error(error?.message || 'Failed to load calendar activity');
    } finally {
      setLoading(false);
    }
  }, [monthCursor, filters, authFetch]);

  useEffect(() => { fetchCounts(); }, [fetchCounts]);

  const handleSelectDate = (dateKey) => {
    setSelectedDate(dateKey);
    setDayPanelOpen(true);
  };

  const handleScheduleContent = (dateKey) => {
    setScheduleDefaultDate(dateKey);
    setScheduleOpen(true);
  };

  const handleScheduled = () => {
    fetchCounts();
    setDayPanelOpen(false);
  };

  const canSchedule = canPublishScheduled(currentUser, currentUser?.permissions);

  return (
    <div style={{ padding: 24, background: 'linear-gradient(180deg, #f7f9fc 0%, #f0f2f5 220px)' }}>
      {/* Header banner */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 46, height: 46, borderRadius: 13, flexShrink: 0,
            background: 'linear-gradient(135deg, #2563eb, #1d4ed8 60%, #4338ca)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 6px 16px rgba(37,99,235,0.35)',
          }}>
            <CalendarDays size={22} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#111827', letterSpacing: -0.3 }}>Editorial Calendar</div>
            <div style={{ fontSize: 13, color: '#6b7280' }}>Plan, schedule, and track newsroom activity at a glance</div>
          </div>
        </div>
        {canSchedule && (
          <button
            onClick={() => handleScheduleContent(null)}
            style={{
              ...DS.btn('primary'),
              background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              boxShadow: '0 8px 20px rgba(37,99,235,0.35)', padding: '10px 20px', fontSize: 14,
            }}
          >
            <Plus size={16} /> Schedule Article
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 620px', minWidth: 0 }}>
          <div style={{ ...DS.card, padding: 16, marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button style={navBtnStyle} onClick={() => setMonthCursor((m) => subMonths(m, 1))}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#f3f4f6'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                  <ChevronLeft size={17} />
                </button>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#111827', minWidth: 170, textAlign: 'center', letterSpacing: -0.3 }}>
                  {format(monthCursor, 'MMMM yyyy')}
                </div>
                <button style={navBtnStyle} onClick={() => setMonthCursor((m) => addMonths(m, 1))}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#f3f4f6'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                  <ChevronRight size={17} />
                </button>
                <button
                  style={{ ...navBtnStyle, width: 'auto', padding: '0 14px', fontSize: 13, fontWeight: 600 }}
                  onClick={() => setMonthCursor(startOfMonth(new Date()))}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#f3f4f6'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; }}
                >
                  Today
                </button>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                {DOT_CONFIG.map((d) => (
                  <div key={d.key} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#4b5563', fontWeight: 500 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: d.color, display: 'inline-block' }} />
                    {d.label}
                  </div>
                ))}
              </div>
            </div>

            <CalendarFilters filters={filters} onChange={setFilters} categories={categories} />
          </div>

          {loading ? (
            <LoadingSpinner />
          ) : (
            <CalendarGrid monthCursor={monthCursor} counts={counts} selectedDate={selectedDate} onSelectDate={handleSelectDate} />
          )}
        </div>

        <div style={{ flex: '0 1 300px', minWidth: 260 }}>
          <MonthSummaryPanel counts={counts} monthCursor={monthCursor} onSelectDate={handleSelectDate} />
        </div>
      </div>

      <DaySchedulePanel
        open={dayPanelOpen}
        onOpenChange={setDayPanelOpen}
        date={selectedDate}
        authFetch={authFetch}
        filters={filters}
        currentUser={currentUser}
        onScheduleContent={handleScheduleContent}
      />

      <ScheduleArticleModal
        open={scheduleOpen}
        onOpenChange={setScheduleOpen}
        authFetch={authFetch}
        onScheduled={handleScheduled}
        defaultDate={scheduleDefaultDate}
      />
    </div>
  );
}
