'use client';
import { useState, useCallback, useRef, useEffect } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

/**
 * Manages active alerts and alert history.
 * - evaluateGate: fires a POST to the backend; deduplicated via pendingRef so
 *   the same gate+occupancy pair is never sent twice simultaneously.
 * - dismissAlert: fires a PATCH and removes from active list.
 * All fetch calls use an AbortController that is cancelled on unmount.
 *
 * @returns {{ activeAlerts: Array, history: Array, evaluateGate: Function, dismissAlert: Function, evaluating: boolean }}
 */
export function useAlerts() {
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [history, setHistory] = useState([]);
  const [evaluating, setEvaluating] = useState(false);
  const pendingRef = useRef(new Set());
  const abortControllers = useRef([]);

  // Cancel all in-flight alert requests on unmount
  useEffect(() => {
    return () => {
      abortControllers.current.forEach((c) => c.abort());
    };
  }, []);

  const evaluateGate = useCallback(async (gate, occupancy) => {
    const key = `${gate}-${occupancy}`;
    if (pendingRef.current.has(key)) return;
    pendingRef.current.add(key);
    setEvaluating(true);

    const controller = new AbortController();
    abortControllers.current.push(controller);

    try {
      const res = await fetch(`${API_BASE}/api/alerts/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gate, occupancy }),
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const alert = await res.json();

      setActiveAlerts((prev) => {
        if (prev.find((a) => a.gate === gate)) return prev;
        return [alert, ...prev];
      });
      setHistory((prev) => [alert, ...prev]);
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Alert evaluation failed:', err);
      }
    } finally {
      // Clean up this controller from the live list
      abortControllers.current = abortControllers.current.filter((c) => c !== controller);
      setEvaluating(false);
      pendingRef.current.delete(key);
    }
  }, []);

  const dismissAlert = useCallback(async (id) => {
    const controller = new AbortController();
    abortControllers.current.push(controller);

    try {
      await fetch(`${API_BASE}/api/alerts/${id}/dismiss`, {
        method: 'PATCH',
        signal: controller.signal,
      });
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Failed to dismiss alert:', err);
      }
    } finally {
      abortControllers.current = abortControllers.current.filter((c) => c !== controller);
    }

    setActiveAlerts((prev) => prev.filter((a) => a.id !== id));
    setHistory((prev) =>
      prev.map((a) => (a.id === id ? { ...a, dismissed: true } : a))
    );
  }, []);

  return { activeAlerts, history, evaluateGate, dismissAlert, evaluating };
}
