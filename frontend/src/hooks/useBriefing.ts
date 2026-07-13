'use client';
import { useState, useCallback, useRef } from 'react';
import { AIBriefingData } from '../types';
import { API_BASE } from '../lib/apiClient';

export function useBriefing() {
  const [briefing, setBriefing] = useState<AIBriefingData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchBriefing = useCallback(async (name: string, role: string, gate: string) => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams({ name, role, gate }).toString();
      const res = await fetch(`${API_BASE}/api/briefing?${query}`, { signal: controller.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: AIBriefingData = await res.json();
      setBriefing(data);
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err.message);
      } else if (!(err instanceof Error)) {
        setError('Unknown error');
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, []);

  return { briefing, loading, error, fetchBriefing };
}
