'use client';
import { useState, useCallback, useRef } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

/**
 * Fetches AI-generated shift briefing data from the backend.
 * Uses AbortController to cancel in-flight requests when a new briefing
 * is fetched before the previous one completes, and on component unmount.
 *
 * @returns {{ briefing: object|null, loading: boolean, error: string|null, fetchBriefing: Function }}
 */
export function useBriefing() {
  const [briefing, setBriefing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  const fetchBriefing = useCallback(async (name, role, gate) => {
    // Cancel any previous in-flight briefing request
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams({ name, role, gate }).toString();
      const res = await fetch(`${API_BASE}/api/briefing?${query}`, { signal: controller.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setBriefing(data);
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Failed to fetch AI briefing:', err);
        setError(err.message);
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, []);

  return { briefing, loading, error, fetchBriefing };
}
