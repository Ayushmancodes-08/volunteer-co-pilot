import { describe, it, expect, mock } from 'bun:test';
import { render, screen, fireEvent } from '@testing-library/react';
import MultilingualPanel from '../src/components/MultilingualPanel';
import { I18nProvider } from '../src/context/I18nContext';

// Mock the useTranslation hook to avoid real API calls in tests
const mockTranslate = mock(() => {});
const mockClearResult = mock(() => {});

mock.module('../src/hooks/useTranslation', () => ({
  useTranslation: () => ({
    result: null,
    loading: false,
    error: null,
    translate: mockTranslate,
    clearResult: mockClearResult,
  }),
}));

function renderWithI18n(ui) {
  return render(<I18nProvider>{ui}</I18nProvider>);
}

describe('MultilingualPanel', () => {
  it('renders the translate button', () => {
    renderWithI18n(<MultilingualPanel />);
    // There should be a submit button
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('renders the language select with all 7 supported languages', () => {
    renderWithI18n(<MultilingualPanel />);
    const languageSelect = document.getElementById('translate-language');
    expect(languageSelect).toBeTruthy();
    const options = languageSelect.querySelectorAll('option');
    expect(options.length).toBe(7);
    const values = Array.from(options).map((o) => o.value);
    expect(values).toContain('spanish');
    expect(values).toContain('arabic');
    expect(values).toContain('hindi');
    expect(values).toContain('japanese');
  });

  it('renders the intent select with all 5 intent options', () => {
    renderWithI18n(<MultilingualPanel />);
    const intentSelect = document.getElementById('translate-intent');
    expect(intentSelect).toBeTruthy();
    const options = intentSelect.querySelectorAll('option');
    expect(options.length).toBe(5);
    const values = Array.from(options).map((o) => o.value);
    expect(values).toContain('redirect');
    expect(values).toContain('medical_urgency');
    expect(values).toContain('emergency_evacuation');
  });

  it('translate submit button is disabled when textarea is empty', () => {
    renderWithI18n(<MultilingualPanel />);
    const submitButton = screen.getAllByRole('button').find(
      (btn) => btn.getAttribute('type') === 'submit'
    );
    expect(submitButton).toBeTruthy();
    expect(submitButton.disabled).toBe(true);
  });

  it('has aria-describedby pointing to an existing hint element', () => {
    renderWithI18n(<MultilingualPanel />);
    const textarea = document.getElementById('translate-text');
    expect(textarea).toBeTruthy();
    const hintId = textarea.getAttribute('aria-describedby');
    expect(hintId).toBe('translate-text-hint');
    const hintEl = document.getElementById(hintId);
    expect(hintEl).toBeTruthy();
  });

  it('renders a section with accessible label', () => {
    renderWithI18n(<MultilingualPanel />);
    const section = screen.getByRole('region', { hidden: true });
    expect(section).toBeTruthy();
  });

  it('handles form submission and calls translate', () => {
    renderWithI18n(<MultilingualPanel />);
    const textarea = document.getElementById('translate-text');
    const form = document.querySelector('form');
    
    // Test empty submit (should return early)
    fireEvent.submit(form);
    expect(mockTranslate).not.toHaveBeenCalled();
    
    // Test valid submit
    fireEvent.change(textarea, { target: { value: 'Hello' } });
    fireEvent.submit(form);
    expect(mockTranslate).toHaveBeenCalledWith('Hello', 'spanish', 'general_info', false);
  });
});
