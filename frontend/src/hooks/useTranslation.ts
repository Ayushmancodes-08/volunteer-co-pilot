'use client';
import { useState, useCallback, useRef } from 'react';
import { TranslationResult } from '../types';
import { API_BASE } from '../lib/apiClient';

const CACHE_KEY_PREFIX = 'trans_cache:';

function getLocalCache(key: string): TranslationResult | null {
  if (typeof window === 'undefined') return null;
  try {
    const cached = localStorage.getItem(CACHE_KEY_PREFIX + key);
    return cached ? JSON.parse(cached) : null;
  } catch {
    return null;
  }
}

function setLocalCache(key: string, value: TranslationResult): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CACHE_KEY_PREFIX + key, JSON.stringify(value));
  } catch {
    // Ignore storage quota limits
  }
}

export function useTranslation() {
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const translate = useCallback(async (
    text: string,
    targetLanguage: string,
    intent: string,
    urgent: boolean
  ) => {
    const cacheKey = `${text.trim()}:${targetLanguage}:${intent}:${urgent}`;
    const cached = getLocalCache(cacheKey);
    if (cached) {
      setResult(cached);
      setError(null);
      return;
    }

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
      const data: TranslationResult = await res.json();
      setLocalCache(cacheKey, data);
      setResult(data);
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err.message);
        setResult(null);
      } else if (!(err instanceof Error)) {
        setError('Unknown error');
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
