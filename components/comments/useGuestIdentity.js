'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const NAME_STORAGE_KEY = 'khabaron_guest_name';
const DEVICE_STORAGE_KEY = 'khabaron_device_id';

function newDeviceId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  // randomUUID needs a secure context; this is only an abuse-limiting label,
  // not a secret, so a non-crypto fallback is fine.
  return Array.from({ length: 4 }, () =>
    Math.random().toString(16).slice(2, 10).padEnd(8, '0')
  ).join('-');
}

/**
 * Client state for a guest (no-login) comment form: the optional display name,
 * the honeypot value and a per-browser device id. `buildGuestPayload(token)` is
 * the `guest` block the comment/reply APIs expect; sending it is also what
 * marks a request as a guest submission server-side. `token` is the
 * server-signed form stamp from the comments response.
 *
 * The name and device id live in localStorage purely as conveniences/abuse
 * signals — they're read after mount (so nothing can mismatch hydration) and
 * every access is guarded, since storage can be blocked or throw.
 */
export default function useGuestIdentity() {
  const [name, setName] = useState('');
  const [website, setWebsite] = useState('');
  // CAPTCHA token from the widget (null until solved) and a counter the form
  // bumps to ask the widget for a new challenge — a token is single-use.
  const [captchaToken, setCaptchaToken] = useState(null);
  const [captchaResetKey, setCaptchaResetKey] = useState(0);
  const deviceId = useRef(null);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(NAME_STORAGE_KEY);
      if (saved) setName(saved);

      let id = window.localStorage.getItem(DEVICE_STORAGE_KEY);
      if (!id) {
        id = newDeviceId();
        window.localStorage.setItem(DEVICE_STORAGE_KEY, id);
      }
      deviceId.current = id;
    } catch {
      // storage unavailable — the server just falls back to its other signals
    }
  }, []);

  const buildGuestPayload = useCallback(
    (token) => ({
      name: name.trim(),
      website,
      token,
      captchaToken,
      deviceId: deviceId.current,
    }),
    [name, website, captchaToken]
  );

  const resetCaptcha = useCallback(() => {
    setCaptchaToken(null);
    setCaptchaResetKey((key) => key + 1);
  }, []);

  // After a successful post, remember the name for next time.
  const markSubmitted = useCallback(() => {
    try {
      const trimmed = name.trim();
      if (trimmed) {
        window.localStorage.setItem(NAME_STORAGE_KEY, trimmed);
      } else {
        window.localStorage.removeItem(NAME_STORAGE_KEY);
      }
    } catch {
      // ignore
    }
  }, [name]);

  return {
    name,
    setName,
    website,
    setWebsite,
    captchaToken,
    setCaptchaToken,
    captchaResetKey,
    resetCaptcha,
    buildGuestPayload,
    markSubmitted,
  };
}
