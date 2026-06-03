'use client';

import React, { memo, useMemo, useCallback } from 'react';

/**
 * Memoized wrapper to prevent unnecessary re-renders
 * Use when props are stable and rarely change
 */
export const MemoComponent = memo(
  ({ children, debug = false }) => {
    if (debug) {
      console.log('Rendering memoized component');
    }
    return children;
  },
  (prevProps, nextProps) => {
    // Return true if props are equal (skip re-render)
    // Return false if props changed (do re-render)
    return prevProps.children === nextProps.children;
  }
);

/**
 * Hook to prevent function recreation on every render
 * Useful for callbacks passed to child components
 */
export function useStableCallback(callback, deps) {
  return useCallback(callback, deps);
}

/**
 * Hook to memoize expensive computations
 */
export function useStableValue(value, deps) {
  return useMemo(() => value, deps);
}

/**
 * Hook to track if component is mounted (prevents memory leaks)
 */
export function useIsMounted() {
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  return isMounted;
}

/**
 * Prevent re-renders when parent updates but props haven't changed
 */
export function usePrevious(value) {
  const ref = React.useRef();

  React.useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}

/**
 * High-order component for selective prop memoization
 */
export function withMemo(Component, propsToCompare) {
  return memo(Component, (prevProps, nextProps) => {
    for (const prop of propsToCompare) {
      if (prevProps[prop] !== nextProps[prop]) {
        return false; // Props changed, re-render
      }
    }
    return true; // Props same, skip re-render
  });
}
