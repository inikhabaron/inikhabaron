'use client';

import { useEffect, useRef } from 'react';

const SAVE_DELAY = 3000;
const MIN_SCROLL_CHANGE = 5;
const MIN_SCROLL_Y_CHANGE = 300;
const MIN_SAVE_PERCENT = 10;
const COMPLETE_AT = 95;

async function request(url, options = {}) {
  const response = await fetch(url, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || 'Request failed');
  }

  return data;
}

function getReadingProgress() {
  const documentHeight = document.documentElement.scrollHeight - window.innerHeight;

  const scrollY = window.pageYOffset || document.documentElement.scrollTop || 0;

  const scrollPercent = documentHeight <= 0
      ? 100 : Math.min(
          100, Math.max(0, (scrollY / documentHeight) * 100)
        );

  return {
    scrollY,
    scrollPercent,
  };
}

function hasMeaningfulChange({
  currentScrollY,
  currentPercent,
  lastScrollY,
  lastPercent,
}) {
  return (
    Math.abs(currentPercent - lastPercent) >= MIN_SCROLL_CHANGE ||
    Math.abs(currentScrollY - lastScrollY) >= MIN_SCROLL_Y_CHANGE
  );
}

export default function useReadingProgress({
  articleId,
  enabled = true,
  ready,
}) {
  const hasRestoredRef = useRef(false);

  const restoringRef = useRef(false);

  const savingRef = useRef(false);

  const completedRef = useRef(false);

  const mountedRef = useRef(false);

  const abortControllerRef = useRef(null);

  const saveTimeoutRef = useRef(null);

  const lastSavedPercentRef = useRef(0);

  const lastSavedScrollYRef = useRef(0);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      abortControllerRef.current?.abort();
    };
  }, []);

  /**
   * Restore progress
   */
  useEffect(() => {
    if (!enabled || !ready || !articleId) {
      return;
    }

    hasRestoredRef.current = false;
    completedRef.current = false;

    abortControllerRef.current?.abort();

    const controller = new AbortController();

    abortControllerRef.current = controller;

    async function restoreProgress() {
      try {
        const result = await request(
          `/api/users/reading-progress/${articleId}`,
          {
            signal: controller.signal,
          }
        );

        if (!mountedRef.current) return;

        if (hasRestoredRef.current) return;

        if (!result.data) return;

        hasRestoredRef.current = true;

        restoringRef.current = true;

        lastSavedPercentRef.current =
          result.data.scrollPercent || 0;

        lastSavedScrollYRef.current =
          result.data.scrollY || 0;

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                window.scrollTo({
                    top: result.data.scrollY || 0,
                    behavior: 'auto',
                });

                restoringRef.current = false;
            });
        });
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error(error);
        }
      }
    }

    restoreProgress();

    return () => controller.abort();

  }, [articleId, enabled, ready]);

  /**
   * Save progress
   */
  useEffect(() => {
    if (!enabled || !ready || !articleId) {
      return;
    }

    async function saveProgress(force = false) {
      console.log('saveProgress()', force);
      if (savingRef.current) {
        return;
      }

      if (restoringRef.current) {
        return;
      }

      if (completedRef.current) {
        return;
      }

      const { scrollY, scrollPercent } = getReadingProgress();

      if (!force && scrollPercent < MIN_SAVE_PERCENT) {
        return;
      }

      if (
        !force &&
        !hasMeaningfulChange({
          currentScrollY: scrollY,
          currentPercent: scrollPercent,
          lastScrollY: lastSavedScrollYRef.current,
          lastPercent: lastSavedPercentRef.current,
        })
      ) {
        return;
      }

      try {
        savingRef.current = true;

        if (scrollPercent >= COMPLETE_AT) {
          completedRef.current = true;

          await request(
            `/api/users/reading-progress/${articleId}`,
            {
              method: 'DELETE',
            }
          );

          return;
        }

        lastSavedScrollYRef.current = scrollY;
        lastSavedPercentRef.current = scrollPercent;

        await request('/api/users/reading-progress', {
          method: 'POST',
          body: JSON.stringify({
            articleId,
            scrollY,
            scrollPercent,
          }),
        });
        
      } catch (error) {
        console.error(error);
      }  finally {
        savingRef.current = false;
      }
    }

    function onScroll() {
      if (restoringRef.current) {
        return;
      }

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(() => {
        saveProgress(false);
      }, SAVE_DELAY);
    }

    function onVisibilityChange() {
      if (document.visibilityState === 'hidden') {
        saveProgress(true);
      }
    }

    function onPageHide() {
      saveProgress(true);
    }

    window.addEventListener('scroll', onScroll, {
      passive: true,
    });

    document.addEventListener(
      'visibilitychange',
      onVisibilityChange
    );

    window.addEventListener('pagehide', onPageHide);

    return () => {
      window.removeEventListener('scroll', onScroll);

      document.removeEventListener(
        'visibilitychange',
        onVisibilityChange
      );

      window.removeEventListener(
        'pagehide',
        onPageHide
      );

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };

  }, [articleId, enabled, ready]);
}