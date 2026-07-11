'use client';
import { useState, useEffect, useRef, useCallback } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const POLL_INTERVAL = 5000;

/**
 * Fetches and polls live gate crowd data every 5 seconds.
 * Polling automatically pauses when the browser tab is hidden (visibilitychange)
 * and resumes when the tab becomes visible again — avoiding wasted network traffic.
 * Each fetch uses an AbortController so in-flight requests are cancelled on
 * unmount or when a new fetch supersedes the previous one.
 *
 * @returns {{ gates: Array<{gate: string, occupancy: number, history: number[], timestamp: string}>, timestamp: string | null, loading: boolean }}
 */
export function useCrowdData() {
  const [gates, setGates] = useState([]);
  const [timestamp, setTimestamp] = useState(null);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef(null);
  const abortRef = useRef(null);

  const fetchData = useCallback(async () => {
    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch(`${API_BASE}/api/crowd`, { signal: controller.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setGates(data.gates);
      setTimestamp(data.timestamp);
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Failed to fetch crowd data:', err);
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [setGates, setTimestamp, setLoading]);

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
    fetchData();
    startPolling();

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPolling();
      } else {
        fetchData();
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