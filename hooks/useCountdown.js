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