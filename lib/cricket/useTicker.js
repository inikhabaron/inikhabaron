'use client';

import { useEffect, useState } from 'react';

// Forces a re-render every `intervalMs` by ticking a timestamp, returning the
// value from the last tick. Lets a component derive live-updating text
// (countdowns, "updated Xs ago") from `Date.now()` without hand-rolling its
// own setInterval/cleanup each time. Re-subscribes whenever intervalMs
// changes, so a caller can slow down or speed up its own tick rate (see
// countdownTickMs in matchStatus.js) just by passing a different value in.
export function useTicker(intervalMs) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!intervalMs) return undefined;
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return now;
}
