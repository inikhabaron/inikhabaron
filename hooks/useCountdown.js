'use client';

import { useEffect, useState } from 'react';

function computeRemaining(targetDate) {
  if (!targetDate) return null;
  const diff = new Date(targetDate).getTime() - Date.now();
  if (diff <= 0) return { expired: true, days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    expired: false,
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
  };
}

// Ticks while `targetDate` is truthy — pass null/undefined to opt out
// entirely (no interval is created). `tickMs` defaults to a full second for
// promotions actually displaying the numeric countdown, but EventCard
// passes a slower tick for cards that only need this to detect the
// Upcoming → Live Now → Ended phase transition, not render digits.
export default function useCountdown(targetDate, tickMs = 1000) {
  const [remaining, setRemaining] = useState(() => computeRemaining(targetDate));

  useEffect(() => {
    setRemaining(computeRemaining(targetDate));
    if (!targetDate) return;
    const interval = setInterval(() => setRemaining(computeRemaining(targetDate)), tickMs);
    return () => clearInterval(interval);
  }, [targetDate, tickMs]);

  return remaining;
}
