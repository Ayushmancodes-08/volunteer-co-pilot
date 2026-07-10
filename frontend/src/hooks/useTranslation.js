'use client';
import { useState, useCallback, useRef } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

/**
 * Manages translation requests to the backend API.
 * Uses AbortController so a previous in-flight request is cancelled when a new
 * translation is triggered before the first one completes.
 *
 * @returns {{ result: object|null, loading: boolean, error: string|null, translate: Function, clearResult: Function }}
 */
export function useTranslation() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  const translate = useCallback(async (text, targetLanguage, intent, urgent) => {
    // Cancel previous in-flight translation request
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, targetLanguage, intent, urgent }),
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setResult(data);
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message);
        setResult(null);
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, []);

  const clearResult = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { result, loading, error, translate, clearResult };
}
