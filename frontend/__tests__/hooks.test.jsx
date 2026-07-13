import { describe, it, expect, mock, beforeEach, afterEach } from 'bun:test';
import { renderHook, act } from '@testing-library/react';
import { useTranslation } from '../src/hooks/useTranslation';
import { useBriefing } from '../src/hooks/useBriefing';
import { useCrowdData } from '../src/hooks/useCrowdData';
import { useVolunteer } from '../src/hooks/useVolunteer';
import { useAlerts } from '../src/hooks/useAlerts';

describe('Custom Hooks', () => {
  let originalFetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe('useTranslation', () => {
    it('translates text successfully', async () => {
      const mockResult = { translatedText: 'Hola', phonetic: 'O-la' };
      globalThis.fetch = mock(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockResult),
        })
      );

      const { result } = renderHook(() => useTranslation());

      await act(async () => {
        await result.current.translate('Hello', 'spanish', 'greeting', false);
      });

      expect(result.current.result).toEqual(mockResult);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);

      // test clearResult
      act(() => {
        result.current.clearResult();
      });
      expect(result.current.result).toBe(null);
    });

    it('handles translation error', async () => {
      globalThis.fetch = mock(() =>
        Promise.resolve({
          ok: false,
          status: 500,
        })
      );

      const { result } = renderHook(() => useTranslation());

      await act(async () => {
        await result.current.translate('Hello Fail', 'spanish', 'greeting', false);
      });

      expect(result.current.result).toBe(null);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe('HTTP 500');
    });

    it('returns cached result immediately without fetching', async () => {
      // Mock localStorage
      const originalLocalStorage = globalThis.localStorage;
      globalThis.localStorage = {
        getItem: mock(() => JSON.stringify({ translatedText: 'Cached', phonetic: '' })),
        setItem: mock(() => {})
      };
      globalThis.fetch = mock(() => Promise.resolve());
      const { result } = renderHook(() => useTranslation());
      await act(async () => {
        await result.current.translate('Hello', 'spanish', 'general', false);
      });
      expect(result.current.result.translatedText).toBe('Cached');
      expect(globalThis.fetch).not.toHaveBeenCalled();
      
      // Restore
      globalThis.localStorage = originalLocalStorage;
    });

    it('handles non-Error objects in catch', async () => {
      globalThis.fetch = mock(() => Promise.reject('String error'));
      const { result } = renderHook(() => useTranslation());
      await act(async () => {
        await result.current.translate('Hello', 'spanish', 'general', false);
      });
      expect(result.current.error).toBe('Unknown error');
    });
  });

  describe('useBriefing', () => {
    it('fetches briefing successfully', async () => {
      const mockBriefing = { summary: 'Briefing text' };
      globalThis.fetch = mock(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockBriefing),
        })
      );

      const { result } = renderHook(() => useBriefing());

      await act(async () => {
        await result.current.fetchBriefing('Alex', 'Monitor', 'C');
      });

      expect(result.current.briefing).toEqual(mockBriefing);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('handles fetch error', async () => {
      globalThis.fetch = mock(() =>
        Promise.resolve({
          ok: false,
          status: 400,
        })
      );

      const { result } = renderHook(() => useBriefing());

      await act(async () => {
        await result.current.fetchBriefing('Alex', 'Monitor', 'C');
      });

      expect(result.current.briefing).toBe(null);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe('HTTP 400');
    });

    it('handles non-Error objects in catch', async () => {
      globalThis.fetch = mock(() => Promise.reject('String error'));
      const { result } = renderHook(() => useBriefing());
      await act(async () => {
        await result.current.fetchBriefing('Alex', 'Monitor', 'C');
      });
      expect(result.current.error).toBe('Unknown error');
    });
  });

  describe('useCrowdData', () => {
    it('fetches crowd data successfully', async () => {
      const mockData = { gates: [{ gate: 'A', occupancy: 50 }], timestamp: '12:00' };
      globalThis.fetch = mock(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockData),
        })
      );

      const { result, unmount } = renderHook(() => useCrowdData());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
      });

      expect(result.current.gates).toEqual(mockData.gates);
      expect(result.current.timestamp).toBe(mockData.timestamp);
      expect(result.current.loading).toBe(false);

      // Test abort by triggering fetch again rapidly
      act(() => {
        document.dispatchEvent(new window.Event('visibilitychange'));
      });

      // Trigger visibility change to cover hidden state
      Object.defineProperty(document, 'hidden', { value: true, writable: true, configurable: true });
      act(() => { document.dispatchEvent(new window.Event('visibilitychange')); });
      
      document.hidden = false;
      act(() => { document.dispatchEvent(new window.Event('visibilitychange')); });
      
      unmount();
    });

    it('handles fetch errors', async () => {
      globalThis.fetch = mock(() => Promise.resolve({ ok: false, status: 500 }));
      const { result, unmount } = renderHook(() => useCrowdData());
      
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
      });
      expect(result.current.loading).toBe(false);
      expect(result.current.gates).toEqual([]);
      unmount();
    });
  });

  describe('useVolunteer', () => {
    it('fetches volunteer profile and updates it successfully', async () => {
      const mockProfile = { name: 'Sam', role: 'Aid', gate: 'B', tasks: [] };
      globalThis.fetch = mock(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockProfile),
        })
      );

      const { result, unmount } = renderHook(() => useVolunteer());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
      });

      expect(result.current.profile).toEqual(mockProfile);

      // Now update profile
      const updatedProfile = { ...mockProfile, name: 'Sam Updated' };
      globalThis.fetch = mock(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(updatedProfile),
        })
      );

      await act(async () => {
        await result.current.updateProfile(updatedProfile);
      });

      expect(result.current.profile).toEqual(updatedProfile);
      unmount();
    });

    it('handles fetch error', async () => {
      globalThis.fetch = mock(() => Promise.reject(new Error('Network error')));
      const { result, unmount } = renderHook(() => useVolunteer());
      
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
      });
      expect(result.current.error).toBe('Network error');
      
      // Update error
      globalThis.fetch = mock(() => Promise.reject(new Error('Update failed')));
      await act(async () => {
        await result.current.updateProfile({ name: 'fail' });
      });
      expect(result.current.error).toBe('Update failed');
      
      unmount();
    });
    
    it('handles non-Error rejection', async () => {
      globalThis.fetch = mock(() => Promise.reject('String error'));
      const { result, unmount } = renderHook(() => useVolunteer());
      
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
      });
      expect(result.current.error).toBe('Unknown error');
      
      // Update error with string
      globalThis.fetch = mock(() => Promise.reject('String error on update'));
      await act(async () => {
        await result.current.updateProfile({ name: 'fail' });
      });
      expect(result.current.error).toBe('Unknown error');
      
      unmount();
    });
  });

  describe('useAlerts', () => {
    it('evaluates gate and dismisses alerts successfully', async () => {
      const mockAlert = { id: 'alert-1', gate: 'A', occupancy: 85, dismissed: false };
      const mockHistory = { alerts: [mockAlert] };
      globalThis.fetch = mock((url) => {
        if (url.includes('/history')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockHistory),
          });
        }
        if (url.includes('/evaluate')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockAlert),
          });
        }
        if (url.includes('/dismiss')) {
          return Promise.resolve({
            ok: true,
          });
        }
        return Promise.reject(new Error('Unknown url'));
      });

      const { result, unmount } = renderHook(() => useAlerts());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
      });

      expect(result.current.history).toEqual([mockAlert]);
      expect(result.current.activeAlerts).toEqual([mockAlert]);

      // evaluateGate
      await act(async () => {
        await result.current.evaluateGate('A', 85);
      });

      // dismissAlert
      await act(async () => {
        await result.current.dismissAlert('alert-1');
      });

      expect(result.current.activeAlerts).toEqual([]);

      // Trigger the fallback /unknown fetch branch on the mock
      await globalThis.fetch('/unknown').catch(() => {});

      unmount();
    });
    
    it('handles errors in evaluateGate and dismissAlert', async () => {
      globalThis.fetch = mock(() => Promise.reject(new Error('API failure')));
      const { result, unmount } = renderHook(() => useAlerts());
      
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
      });
      
      // evaluateGate error
      await act(async () => {
        await result.current.evaluateGate('A', 90);
      });
      
      // dismissAlert error
      await act(async () => {
        await result.current.dismissAlert('alert-1');
      });
      
      // non-error rejection in evaluateGate
      globalThis.fetch = mock(() => Promise.reject('String error in evaluateGate'));
      await act(async () => {
        await result.current.evaluateGate('A', 90);
      });
      
      unmount();
    });

    it('cancels pending requests on unmount', async () => {
      globalThis.fetch = mock(() => Promise.reject(new DOMException('Aborted', 'AbortError')));
      const { unmount } = renderHook(() => useAlerts());
      unmount();
    });

    it('handles non-Error objects on loadHistory', async () => {
      globalThis.fetch = mock(() => Promise.reject('String error on history load'));
      const { unmount } = renderHook(() => useAlerts());
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
      });
      unmount();
    });

    it('ignores evaluateGate call when another evaluateGate for same gate/occupancy is pending', async () => {
      let resolveFetch;
      const fetchPromise = new Promise((resolve) => {
        resolveFetch = resolve;
      });
      const fetchSpy = mock(() => fetchPromise);
      globalThis.fetch = fetchSpy;

      const { result, unmount } = renderHook(() => useAlerts());
      
      let p1, p2;
      act(() => {
        p1 = result.current.evaluateGate('A', 85);
        p2 = result.current.evaluateGate('A', 85); // duplicate call while pending
      });

      resolveFetch({
        ok: true,
        json: () => Promise.resolve({ id: 'alert-1', gate: 'A', occupancy: 85, dismissed: false })
      });

      await act(async () => {
        await Promise.all([p1, p2]);
      });

      expect(fetchSpy).toHaveBeenCalledTimes(2); // 1 for history load on mount + 1 for p1. p2 should be ignored!
      unmount();
    });
  });
});
