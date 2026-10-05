'use client';

import { useContext, useEffect, useRef, useState } from 'react';

import { DarkCtx } from '@/lib/news-contexts';

import styles from './Comments.module.css';

/**
 * Cloudflare Turnstile widget for guest comment/reply forms. It is rendered
 * only when the comments API reports a CAPTCHA is configured. See
 * lib/services/comments/guestCaptcha.js for the server side and for what to
 * change to use a different provider.
 *
 * `onToken(token)` fires with a fresh token when the challenge is solved, and
 * with null when it expires or errors. A token is single-use, so the parent
 * bumps `resetKey` after every submit attempt to get a new challenge.
 */

const SCRIPT_SRC =
  'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

let scriptPromise;

// One shared <script> for every widget on the page (comment form + reply forms).
function loadTurnstile() {
  if (window.turnstile) {
    return Promise.resolve(window.turnstile);
  }

  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve(window.turnstile);
      script.onerror = () => {
        scriptPromise = undefined;
        reject(new Error('Turnstile failed to load'));
      };
      document.head.appendChild(script);
    });
  }

  return scriptPromise;
}

export default function CaptchaWidget({ siteKey, onToken, resetKey = 0 }) {
  const dark = useContext(DarkCtx);
  const containerRef = useRef(null);
  const widgetId = useRef(null);
  const onTokenRef = useRef(onToken);
  const isFirstRender = useRef(true);
  const [loadFailed, setLoadFailed] = useState(false);

  onTokenRef.current = onToken;

  useEffect(() => {
    let cancelled = false;

    loadTurnstile()
      .then((turnstile) => {
        if (cancelled || !containerRef.current) return;

        widgetId.current = turnstile.render(containerRef.current, {
          sitekey: siteKey,
          theme: dark ? 'dark' : 'light',
          callback: (token) => onTokenRef.current?.(token),
          'expired-callback': () => onTokenRef.current?.(null),
          'error-callback': () => onTokenRef.current?.(null),
        });
      })
      .catch(() => {
        if (!cancelled) {
          setLoadFailed(true);
          onTokenRef.current?.(null);
        }
      });

    return () => {
      cancelled = true;

      try {
        if (widgetId.current != null) {
          window.turnstile?.remove(widgetId.current);
        }
      } catch {
        // widget already gone
      }

      widgetId.current = null;
    };
  }, [siteKey, dark]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    try {
      if (widgetId.current != null) {
        window.turnstile?.reset(widgetId.current);
      }
    } catch {
      // ignore
    }

    onTokenRef.current?.(null);
  }, [resetKey]);

  return (
    <div className={styles.captcha}>
      <div ref={containerRef} />

      {loadFailed && (
        <span className={styles.guestNotice}>
          The verification check could not load. Please disable any content
          blocker for this site and refresh the page, or log in to comment.
        </span>
      )}
    </div>
  );
}
