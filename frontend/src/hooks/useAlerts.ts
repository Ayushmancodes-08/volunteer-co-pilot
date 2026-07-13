'use client';
import { useState, useCallback, useRef, useEffect } from 'react';
import { Alert } from '../types';
import { API_BASE } from '../lib/apiClient';

export function useAlerts() {
  const [activeAlerts, setActiveAlerts] = useState<Alert[]>([]);
  const [history, setHistory] = useState<Alert[]>([]);
  const [evaluating, setEvaluating] = useState<boolean>(false);
  const pendingRef = useRef<Set<string>>(new Set());
  const abortControllers = useRef<AbortController[]>([]);

  // Cancel all in-flight alert requests on unmount
  useEffect(() => {
    return () => {
      abortControllers.current.forEach((c) => c.abort());
    };
  }, []);

  // Load alert history on mount to preserve state across page reloads
  useEffect(() => {
    const controller = new AbortController();
    abortControllers.current.push(controller);

    async function loadHistory() {
      try {
        const res = await fetch(`${API_BASE}/api/alerts/history`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const allAlerts: Alert[] = data.alerts || [];
        setHistory(allAlerts);
        setActiveAlerts(allAlerts.filter((a) => !a.dismissed));
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== 'AbortError') {
          console.error('Failed to fetch alert history on mount:', err);
        }
      } finally {
        abortControllers.current = abortControllers.current.filter((c) => c !== controller);
      }
    }

    void loadHistory();
  }, []);

  const evaluateGate = useCallback(async (gate: string, occupancy: number) => {
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
      const alert: Alert = await res.json();

      setActiveAlerts((prev) => {
        if (prev.find((a) => a.gate === gate)) return prev;
        return [alert, ...prev];
      });
      setHistory((prev) => [alert, ...prev]);
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error('Alert evaluation failed:', err);
      }
    } finally {
      abortControllers.current = abortControllers.current.filter((c) => c !== controller);
      setEvaluating(false);
      pendingRef.current.delete(key);
    }
  }, []);

  const dismissAlert = useCallback(async (id: string) => {
    const controller = new AbortController();
    abortControllers.current.push(controller);

    try {
      const res = await fetch(`${API_BASE}/api/alerts/${id}/dismiss`, {
        method: 'PATCH',
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
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
