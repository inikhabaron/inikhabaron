'use client';

import { useCallback, useEffect, useState } from 'react';
import { registerServiceWorkerAndToken } from '@/lib/notifications/registerPush';

export default function useNotificationOptIn() {
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setSubscribed(Notification.permission === 'granted');
    }
  }, []);

  const subscribe = useCallback(async () => {
    setLoading(true);
    try {
      const { token, error } = await registerServiceWorkerAndToken();
      setSubscribed(!!token);
      return { success: !!token, error };
    } finally {
      setLoading(false);
    }
  }, []);

  return { subscribed, subscribe, loading };
}
