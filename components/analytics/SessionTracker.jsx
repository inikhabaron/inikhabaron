'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

const SESSION_STORAGE_KEY = 'khabaron_site_session';
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 Minutes session

function getDayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function createSessionPayload(now) {
  return {
    sessionId:
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `sess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    startedAt: now,
    lastActivityAt: now,
    dayKey: getDayKey(new Date(now)),
  };
}

export default function SessionTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const now = Date.now();
    const todayKey = getDayKey(new Date(now));

    let currentSession = null;

    try {
      const raw = localStorage.getItem(SESSION_STORAGE_KEY);
      currentSession = raw ? JSON.parse(raw) : null;
    } catch (error) {
      console.error('Failed to parse stored session:', error);
      currentSession = null;
    }

    const shouldStartNewSession =
      !currentSession ||
      !currentSession.sessionId ||
      !currentSession.lastActivityAt ||
      currentSession.dayKey !== todayKey ||
      now - Number(currentSession.lastActivityAt) > SESSION_TIMEOUT_MS;

    if (shouldStartNewSession) {
      const newSession = createSessionPayload(now);

      try {
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(newSession));
      } catch (error) {
        console.error('Failed to store session data:', error);
      }

      fetch('/api/analytics/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({ sessionId: newSession.sessionId }),
      })
        .then(async (res) => {
          const data = await res.json().catch(() => ({}));
        })
        .catch((error) => {
          console.error('Failed to record site session:', error);
        });

      return;
    }

    const updatedSession = {
      ...currentSession,
      lastActivityAt: now,
      dayKey: todayKey,
    };

    try {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(updatedSession));
    } catch (error) {
      console.error('Failed to update session activity:', error);
    }
  }, [pathname]);

  return null;
}