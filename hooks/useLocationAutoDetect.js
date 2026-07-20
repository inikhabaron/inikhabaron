'use client';

import { useCallback, useEffect, useState } from 'react';

// Drives the first-visit "use my location?" flow. Only ever prompts when
// the user has no saved location AND has never answered the prompt before —
// once either is true (manual save, auto-confirm, or an explicit dismiss),
// it never asks again.
export default function useLocationAutoDetect(isSignedIn) {
  const [shouldPrompt, setShouldPrompt] = useState(false);
  const [step, setStep] = useState('idle'); // idle | detecting | confirm | error
  const [candidate, setCandidate] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isSignedIn) return;
    let active = true;

    (async () => {
      try {
        const response = await fetch('/api/users/location', { credentials: 'include', cache: 'no-store' });
        if (!response.ok) return;
        const data = await response.json();
        if (!active || !data.success) return;
        const location = data.data || {};
        if (!location.enabled && !location.stateId && !location.locationPromptSeenAt) {
          setShouldPrompt(true);
        }
      } catch (err) {
        // Non-critical — just skip the prompt if the lookup fails.
      }
    })();

    return () => { active = false; };
  }, [isSignedIn]);

  const markPromptSeen = useCallback(async () => {
    setShouldPrompt(false);
    try {
      await fetch('/api/users/location/prompt-seen', { method: 'POST', credentials: 'include' });
    } catch (err) {
      // Non-critical.
    }
  }, []);

  const requestDetect = useCallback(async () => {
    setStep('detecting');
    setError('');

    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      setError('Location is not supported in this browser.');
      setStep('error');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const response = await fetch('/api/users/location/detect', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            }),
          });
          const data = await response.json();
          if (!data.success || !data.data?.matched) {
            setError('Unable to determine your location.');
            setStep('error');
            return;
          }
          setCandidate(data.data);
          setStep('confirm');
        } catch (err) {
          setError('Unable to determine your location.');
          setStep('error');
        }
      },
      () => {
        setError('Location permission denied.');
        setStep('error');
        markPromptSeen();
      },
      { timeout: 10000 }
    );
  }, [markPromptSeen]);

  const confirmCandidate = useCallback(async () => {
    if (!candidate) return { success: false };
    try {
      const response = await fetch('/api/users/location', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'auto',
          scope: candidate.scope,
          stateId: candidate.stateId,
          stateName: candidate.stateName,
          stateSlug: candidate.stateSlug,
          districtId: candidate.districtId,
          districtName: candidate.districtName,
          districtSlug: candidate.districtSlug,
        }),
      });
      const data = await response.json();
      setShouldPrompt(false);
      setStep('idle');
      return { success: !!data.success };
    } catch (err) {
      return { success: false };
    }
  }, [candidate]);

  const dismiss = useCallback(() => {
    setStep('idle');
    markPromptSeen();
  }, [markPromptSeen]);

  return { shouldPrompt, step, candidate, error, requestDetect, confirmCandidate, dismiss };
}
