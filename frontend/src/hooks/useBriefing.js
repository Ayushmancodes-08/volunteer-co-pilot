'use client';
import { useState, useCallback } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export function useBriefing() {
  const [briefing, setBriefing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchBriefing = useCallback(async (name, role, gate) => {
    setLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams({ name, role, gate }).toString();
      const res = await fetch(`${API_BASE}/api/briefing?${query}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setBriefing(data);
    } catch (err) {
      console.error('Failed to fetch AI briefing:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  return { briefing, loading, error, fetchBriefing };
}
