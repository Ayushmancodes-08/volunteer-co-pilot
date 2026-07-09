'use client';
import { useState, useEffect, useCallback } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export function useVolunteer() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/volunteer`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setProfile(data);
    } catch (err) {
      console.error('Failed to fetch volunteer profile:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (newProfile) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/volunteer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProfile),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setProfile(data);
    } catch (err) {
      console.error('Failed to update volunteer profile:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return { profile, loading, error, updateProfile, refetch: fetchProfile };
}
