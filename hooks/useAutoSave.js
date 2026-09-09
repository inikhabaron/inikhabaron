'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Auto-save hook for the news editor.
 *
 * Saves the current form state to the server:
 *   - 5 seconds after the last edit (debounce)
 *   - Every 30 seconds unconditionally (interval)
 *   - Immediately on beforeunload (via fetch + keepalive)
 *   - Immediately on visibilitychange (tab goes to background)
 *
 * @param {object}   options
 * @param {object}   options.newsForm       Current form state
 * @param {object}   options.editingNews    Article being edited (null for new)
 * @param {boolean}  options.isDialogOpen   Only save when the editor is open
 * @param {Function} options.getAuthHeaders Auth header builder
 * @param {string}   options.draftId        Client-generated UUID for this draft
 * @param {string}   options.sessionId      Client-generated UUID for this editor session
 *
 * @returns {{ saveStatus, lastSavedAt, draftVersion, conflict }}
 */
export default function useAutoSave({
  newsForm,
  editingNews,
  isDialogOpen,
  getAuthHeaders,
  draftId,
  sessionId,
}) {
  // 'idle' | 'saving' | 'saved' | 'error'
  const [saveStatus, setSaveStatus] = useState('idle');
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [draftVersion, setDraftVersion] = useState(0);
  const [conflict, setConflict] = useState(false);

  // Refs to avoid stale closures in event handlers and timers
  const formRef = useRef(newsForm);
  const lastSnapshotRef = useRef(null);
  const debounceTimerRef = useRef(null);
  const intervalTimerRef = useRef(null);
  const isSavingRef = useRef(false);
  const isOpenRef = useRef(isDialogOpen);
  const draftIdRef = useRef(draftId);
  const sessionIdRef = useRef(sessionId);
  const editingNewsRef = useRef(editingNews);
  const getAuthHeadersRef = useRef(getAuthHeaders);

  // Keep refs fresh
  useEffect(() => { formRef.current = newsForm; }, [newsForm]);
  useEffect(() => { isOpenRef.current = isDialogOpen; }, [isDialogOpen]);
  useEffect(() => { draftIdRef.current = draftId; }, [draftId]);
  useEffect(() => { sessionIdRef.current = sessionId; }, [sessionId]);
  useEffect(() => { editingNewsRef.current = editingNews; }, [editingNews]);
  useEffect(() => { getAuthHeadersRef.current = getAuthHeaders; }, [getAuthHeaders]);

  // Build the autosave payload from the current form state
  const buildPayload = useCallback(() => {
    const form = formRef.current;
    if (!form) return null;

    return {
      draftId: draftIdRef.current,
      newsId: editingNewsRef.current?.id || null,
      sessionId: sessionIdRef.current,
      title: form.title || '',
      content: form.content || '',
      excerpt: form.excerpt || '',
      category: form.category || '',
      tags: form.tags || '',
      featuredImage: form.featuredImage || '',
      images: form.images || [],
      status: form.status || 'draft',
      authorLabel: form.authorLabel || 'Author',
      authors: form.authors || [],
      source: form.source || '',
      sourceUrl: form.sourceUrl || '',
      seoTitle: form.seoTitle || '',
      seoDescription: form.seoDescription || '',
      seoKeywords: form.seoKeywords || '',
      scheduledAt: form.scheduledAt || '',
      location: form.location || null,
      breakingSuggested: form.breakingSuggested || false,
      trendingSuggested: form.trendingSuggested || false,
      isFeatured: form.isFeatured || false,
    };
  }, []);

  // Check if form has changed since last save
  const hasChanges = useCallback(() => {
    const current = buildPayload();
    if (!current) return false;
    if (!lastSnapshotRef.current) return true;

    // Quick shallow comparison via JSON — the form fields are all
    // primitives, small arrays of primitives, or small objects, so this
    // is fast enough and avoids deep-equality library overhead.
    return JSON.stringify(current) !== JSON.stringify(lastSnapshotRef.current);
  }, [buildPayload]);

  // Perform the actual save
  const doSave = useCallback(async (options = {}) => {
    const { keepalive = false } = options;

    if (!isOpenRef.current && !keepalive) return;
    if (isSavingRef.current && !keepalive) return;
    if (!draftIdRef.current || !sessionIdRef.current) return;

    const payload = buildPayload();
    if (!payload) return;

    // Don't save if nothing has changed (unless forced by beforeunload)
    if (!keepalive && !hasChanges()) return;

    isSavingRef.current = true;
    if (!keepalive) setSaveStatus('saving');

    try {
      const res = await fetch('/api/news/autosave', {
        method: 'POST',
        headers: getAuthHeadersRef.current(),
        body: JSON.stringify(payload),
        keepalive,
      });

      if (!res.ok) throw new Error(`Save failed (${res.status})`);

      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Save failed');

      // Snapshot what we just saved so we can detect future changes
      lastSnapshotRef.current = { ...payload };

      if (!keepalive) {
        setSaveStatus('saved');
        setLastSavedAt(new Date(data.data.autoSavedAt));
        setDraftVersion(data.data.draftVersion);
        if (data.data.conflict) setConflict(true);
      }
    } catch (err) {
      console.error('[useAutoSave] save error:', err);
      if (!keepalive) setSaveStatus('error');
    } finally {
      isSavingRef.current = false;
    }
  }, [buildPayload, hasChanges]);

  // ── Debounced save on form changes (5s after last edit) ──
  useEffect(() => {
    if (!isDialogOpen || !draftId) return;

    // Clear any existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set a new debounce timer
    debounceTimerRef.current = setTimeout(() => {
      doSave();
    }, 5000);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
    // newsForm is intentionally included — every form change resets the debounce
  }, [newsForm, isDialogOpen, draftId, doSave]);

  // ── Unconditional interval save every 30s ──
  useEffect(() => {
    if (!isDialogOpen || !draftId) return;

    intervalTimerRef.current = setInterval(() => {
      doSave();
    }, 30000);

    return () => {
      if (intervalTimerRef.current) {
        clearInterval(intervalTimerRef.current);
      }
    };
  }, [isDialogOpen, draftId, doSave]);

  // ── Save on beforeunload (tab/browser close) and visibilitychange ──
  useEffect(() => {
    if (!isDialogOpen || !draftId) return;

    const handleBeforeUnload = () => {
      if (!hasChanges()) return;
      // Use fetch with keepalive to survive the page unload.
      // This is the Beacon-like approach that preserves auth headers.
      doSave({ keepalive: true });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        doSave({ keepalive: true });
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isDialogOpen, draftId, doSave, hasChanges]);

  // ── Reset state when dialog closes ──
  useEffect(() => {
    if (!isDialogOpen) {
      setSaveStatus('idle');
      setLastSavedAt(null);
      setDraftVersion(0);
      setConflict(false);
      lastSnapshotRef.current = null;
      isSavingRef.current = false;
    }
  }, [isDialogOpen]);

  // ── Flush a save on unmount ──
  // Covers SPA route changes away from the editor (e.g. navigating to a
  // different admin page): unlike a tab switch within /admin, this unmounts
  // the component entirely, so the debounce/interval timers never fire again.
  // keepalive bypasses the isDialogOpen check since state may not have
  // updated yet by the time this cleanup runs.
  useEffect(() => {
    return () => {
      if (!draftIdRef.current || !sessionIdRef.current) return;
      if (!hasChanges()) return;
      doSave({ keepalive: true });
    };
  }, [doSave, hasChanges]);

  return { saveStatus, lastSavedAt, draftVersion, conflict };
}
