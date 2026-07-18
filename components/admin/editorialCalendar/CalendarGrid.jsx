'use client';

import { useState } from 'react';
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, format, isSameMonth, isToday,
} from 'date-fns';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { DS } from '@/components/admin/design-system';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Activity-dot legend (distinct from the article-status badge colors used
// elsewhere in the admin) — see calendarService.js's module docstring for
// what backs each type. Breaking + tasks share the red dot, per the user's
// own spec: "urgent notification, pending action, important task, or
// breaking-news-related item" describes one color, not two.
export const DOT_CONFIG = [
  { key: 'updated', color: '#16a34a', bg: '#dcfce7', label: 'Updated' },
  { key: 'scheduled', color: '#d97706', bg: '#fef3c7', label: 'Scheduled' },
  { key: 'urgent', color: '#dc2626', bg: '#fee2e2', label: 'Urgent' },
  { key: 'published', color: '#2563eb', bg: '#dbeafe', label: 'Published' },
  { key: 'draft', color: '#6b7280', bg: '#f1f5f9', label: 'Draft' },
];

function toChips(counts) {
  if (!counts) return [];
  const urgent = (counts.breaking || 0) + (counts.tasks || 0);
  const values = { updated: counts.updated || 0, scheduled: counts.scheduled || 0, urgent, published: counts.published || 0, draft: counts.draft || 0 };
  return DOT_CONFIG.filter((d) => values[d.key] > 0).map((d) => ({ ...d, count: values[d.key] }));
}

function DayCell({ day, monthCursor, chips, selected, isWeekend, onSelectDate }) {
  const [hovered, setHovered] = useState(false);
  const key = format(day, 'yyyy-MM-dd');
  const inMonth = isSameMonth(day, monthCursor);
  const today = isToday(day);

  const cellBg = selected
    ? 'linear-gradient(180deg, #eff6ff 0%, #e0edff 100%)'
    : today
    ? '#f8fbff'
    : hovered && inMonth
    ? '#f9fafb'
    : inMonth ? (isWeekend ? '#fcfcff' : '#fff') : '#fafafa';

  const shadow = selected
    ? 'inset 0 0 0 2px #2563eb'
    : hovered && inMonth
    ? '0 6px 16px rgba(15,23,42,0.08)'
    : 'none';

  return (
    <div
      onClick={() => onSelectDate(key)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative', minHeight: 84, minWidth: 0, padding: '10px 8px 8px', cursor: 'pointer',
        borderRight: '1px solid #f1f2f4', borderBottom: '1px solid #f1f2f4',
        background: cellBg,
        boxShadow: shadow,
        zIndex: hovered ? 1 : 'auto',
        transition: 'background 0.15s ease, box-shadow 0.15s ease',
      }}
    >
      {selected && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #2563eb, #4f8bff)' }} />
      )}
      <div style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 30, height: 30, borderRadius: '50%', fontSize: 15, fontWeight: 700,
        color: inMonth ? '#1f2937' : '#c1c5cb',
        background: today ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : 'transparent',
        boxShadow: today ? '0 3px 8px rgba(37,99,235,0.35)' : 'none',
        transition: 'transform 0.15s ease',
        transform: hovered && !today ? 'scale(1.06)' : 'scale(1)',
        ...(today ? { color: '#fff' } : {}),
      }}>
        {format(day, 'd')}
      </div>

      {chips.length > 0 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 4, minWidth: 0 }}>
              {chips.map((chip) => (
                <span
                  key={chip.key}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    fontSize: 11, fontWeight: 700, color: chip.color,
                    background: chip.bg, borderRadius: 999, padding: '2px 7px 2px 6px',
                  }}
                >
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: chip.color, display: 'inline-block', flexShrink: 0 }} />
                  {chip.count}
                </span>
              ))}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            {chips.map((chip) => `${chip.count} ${chip.label}`).join(' · ')}
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}

export function CalendarGrid({ monthCursor, counts, selectedDate, onSelectDate }) {
  const gridStart = startOfWeek(startOfMonth(monthCursor));
  const gridEnd = endOfWeek(endOfMonth(monthCursor));
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  return (
    <TooltipProvider delayDuration={200}>
      {/* Overflow fix: this wrapper is the ONLY element allowed to scroll
          horizontally if a day cell ever genuinely needs more room than the
          viewport — the sidebar/page must never do so. */}
      <div style={{
        ...DS.card, padding: 0, width: '100%', overflowX: 'auto',
        borderRadius: 16, boxShadow: '0 1px 2px rgba(15,23,42,0.04), 0 14px 32px rgba(15,23,42,0.07)',
        border: '1px solid #eef0f3',
      }}>
        <div style={{ height: 4, borderRadius: '16px 16px 0 0', background: 'linear-gradient(90deg, #dc2626 0%, #2563eb 55%, #4f8bff 100%)', minWidth: 560 }} />
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
          borderBottom: '1px solid #e5e7eb', minWidth: 560,
          background: 'linear-gradient(180deg, #f9fafb 0%, #f4f5f7 100%)',
        }}>
          {WEEKDAYS.map((label, idx) => (
            <div key={label} style={{ padding: '12px 12px', fontSize: 12, fontWeight: 700, color: idx === 0 || idx === 6 ? '#9ca3af' : '#6b7280', textAlign: 'center', textTransform: 'uppercase', letterSpacing: 0.6 }}>
              {label}
            </div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', minWidth: 560 }}>
          {days.map((day) => {
            const dayOfWeek = day.getDay();
            return (
              <DayCell
                key={format(day, 'yyyy-MM-dd')}
                day={day}
                monthCursor={monthCursor}
                chips={toChips(counts?.[format(day, 'yyyy-MM-dd')])}
                selected={selectedDate === format(day, 'yyyy-MM-dd')}
                isWeekend={dayOfWeek === 0 || dayOfWeek === 6}
                onSelectDate={onSelectDate}
              />
            );
          })}
        </div>
      </div>
    </TooltipProvider>
  );
}
