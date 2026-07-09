'use client';
import { useState, useEffect, useRef, useCallback } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const POLL_INTERVAL = 5000;

export function useCrowdData() {
  const [gates, setGates] = useState([]);
  const [timestamp, setTimestamp] = useState(null);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/crowd`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setGates(data.gates);
      setTimestamp(data.timestamp);
    } catch (err) {
      console.error('Failed to fetch crowd data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    intervalRef.current = setInterval(fetchData, POLL_INTERVAL);
    return () => clearInterval(intervalRef.current);
  }, [fetchData]);

  return { gates, timestamp, loading };
}