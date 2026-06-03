'use client';

import { lazy, Suspense } from 'react';

/**
 * Lazy loading wrapper for components
 * Reduces initial bundle size by code-splitting components
 */
export function createLazyComponent(
  importFn,
  fallback = <div className="h-64 bg-gray-200 animate-pulse rounded" />
) {
  const Component = lazy(importFn);

  return function LazyComponent(props) {
    return (
      <Suspense fallback={fallback}>
        <Component {...props} />
      </Suspense>
    );
  };
}

/**
 * Common lazy-loaded components
 * Import these instead of importing directly to reduce bundle
 */

export const LazyDashboardView = createLazyComponent(
  () => import('@/components/admin/DashboardView'),
  <div className="h-96 bg-blue-50 animate-pulse rounded" />
);

export const LazyNewsFormDialog = createLazyComponent(
  () => import('@/components/admin/NewsFormDialog'),
  <div className="h-48 bg-gray-200 animate-pulse rounded" />
);

export const LazyLiveCard = createLazyComponent(
  () => import('@/components/home/LiveCard'),
  <div className="h-64 bg-gray-200 animate-pulse rounded" />
);

export const LazyArticleModal = createLazyComponent(
  () => import('@/components/home/ArticleModal'),
  <div className="h-96 bg-gray-200 animate-pulse rounded" />
);

export const LazyAuthDialog = createLazyComponent(
  () => import('@/components/home/AuthDialog'),
  <div className="h-64 bg-gray-200 animate-pulse rounded" />
);

/**
 * Interactive elements that benefit from lazy loading
 */
export const LazyChart = createLazyComponent(
  () => import('@/components/ui/chart'),
  <div className="h-80 bg-gray-200 animate-pulse rounded" />
);

export const LazyCarousel = createLazyComponent(
  () => import('@/components/ui/carousel'),
  <div className="h-48 bg-gray-200 animate-pulse rounded" />
);
