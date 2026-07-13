'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { VolunteerProfile } from '../types';
import { API_BASE } from '../lib/apiClient';

export function useVolunteer() {
  const [profile, setProfile] = useState<VolunteerProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchProfile = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch(`${API_BASE}/api/volunteer`, { signal: controller.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: VolunteerProfile = await res.json();
      setProfile(data);
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

  const updateProfile = useCallback(async (newProfile: VolunteerProfile) => {
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
      const data: VolunteerProfile = await res.json();
      setProfile(data);
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

  useEffect(() => {
    void fetchProfile();
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, [fetchProfile]);

  return { profile, loading, error, updateProfile, refetch: fetchProfile };
}
