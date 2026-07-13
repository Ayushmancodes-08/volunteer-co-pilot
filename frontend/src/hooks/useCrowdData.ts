'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { GateCrowdData } from '../types';
import { API_BASE } from '../lib/apiClient';
const POLL_INTERVAL = 5000;

export function useCrowdData() {
  const [gates, setGates] = useState<GateCrowdData[]>([]);
  const [timestamp, setTimestamp] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async () => {
    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch(`${API_BASE}/api/crowd`, { signal: controller.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: { gates: GateCrowdData[]; timestamp: string } = await res.json();
      setGates(data.gates);
      setTimestamp(data.timestamp);
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error('Failed to fetch crowd data:', err);
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, []);

  const startPolling = useCallback(() => {
    if (intervalRef.current) return;
    intervalRef.current = setInterval(() => { void fetchData(); }, POLL_INTERVAL);
  }, [fetchData]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    void fetchData();
    startPolling();

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPolling();
      } else {
        void fetchData();
        startPolling();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      stopPolling();
      if (abortRef.current) abortRef.current.abort();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchData, startPolling, stopPolling]);

  return { gates, timestamp, loading };
}
