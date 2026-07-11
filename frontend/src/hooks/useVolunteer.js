'use client';
import { useState, useEffect, useCallback, useRef } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

/**
 * Manages the current volunteer profile — fetches on mount, exposes an update function.
 * All fetch calls use AbortController to cancel in-flight requests on unmount,
 * preventing setState calls on unmounted components.
 *
 * @returns {{ profile: {name: string, role: string, gate: string, tasks: Array<{id: string, text: string, completed: boolean}>} | null, loading: boolean, error: string | null, updateProfile: (newProfile: object) => Promise<void>, refetch: () => Promise<void> }}
 */
export function useVolunteer() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  const fetchProfile = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch(`${API_BASE}/api/volunteer`, { signal: controller.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setProfile(data);
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Failed to fetch volunteer profile:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, []);

  const updateProfile = useCallback(async (newProfile) => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/volunteer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProfile),
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setProfile(data);
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Failed to update volunteer profile:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchProfile();
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, [fetchProfile]);

  return { profile, loading, error, updateProfile, refetch: fetchProfile };
}