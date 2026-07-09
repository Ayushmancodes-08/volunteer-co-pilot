'use client';
import { useState, useCallback, useRef } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export function useAlerts() {
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [history, setHistory] = useState([]);
  const [evaluating, setEvaluating] = useState(false);
  const pendingRef = useRef(new Set());

  const evaluateGate = useCallback(async (gate, occupancy) => {
    const key = `${gate}-${occupancy}`;
    if (pendingRef.current.has(key)) return;
    pendingRef.current.add(key);
    setEvaluating(true);

    try {
      const res = await fetch(`${API_BASE}/api/alerts/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gate, occupancy }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const alert = await res.json();

      setActiveAlerts((prev) => {
        if (prev.find((a) => a.gate === gate)) return prev;
        return [alert, ...prev];
      });
      setHistory((prev) => [alert, ...prev]);
    } catch (err) {
      console.error('Alert evaluation failed:', err);
    } finally {
      setEvaluating(false);
      pendingRef.current.delete(key);
    }
  }, []);

  const dismissAlert = useCallback(async (id) => {
    try {
      await fetch(`${API_BASE}/api/alerts/${id}/dismiss`, { method: 'PATCH' });
    } catch (err) {
      console.error('Failed to dismiss alert:', err);
    }
    setActiveAlerts((prev) => prev.filter((a) => a.id !== id));
    setHistory((prev) =>
      prev.map((a) => (a.id === id ? { ...a, dismissed: true } : a))
    );
  }, []);

  return { activeAlerts, history, evaluateGate, dismissAlert, evaluating };
}