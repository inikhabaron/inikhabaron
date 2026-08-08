'use client';

import { Timer } from 'lucide-react';
import { useTicker } from '@/lib/cricket/useTicker';
import { countdownTickMs, formatCountdown } from '@/lib/cricket/matchStatus';

// Live-ticking "Starts in 2h 14m" for an upcoming match. Self-contained
// (owns its own interval via useTicker) so any card/detail view can drop it
// in without wiring its own clock — the tick rate speeds up to 1s inside the
// final minute and idles at 30s otherwise (see countdownTickMs).
export default function MatchCountdown({ dateTimeGMT, isHindi, style, showIcon = false }) {
  const initialRemaining = dateTimeGMT ? new Date(dateTimeGMT).getTime() - Date.now() : null;
  const now = useTicker(countdownTickMs(initialRemaining));
  if (!dateTimeGMT) return null;

  const remaining = new Date(dateTimeGMT).getTime() - now;
  const label = formatCountdown(remaining, isHindi);
  if (!label) return null;

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, ...style }}>
      {showIcon && <Timer size={12} aria-hidden="true" />}
      {label}
    </span>
  );
}
