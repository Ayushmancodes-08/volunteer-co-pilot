import { describe, it, expect } from 'bun:test';
import { render, screen } from '@testing-library/react';
import VoiceInput from '../src/components/VoiceInput.jsx';
import { I18nProvider } from '../src/context/I18nContext.jsx';

function renderWithI18n(ui) {
  return render(<I18nProvider>{ui}</I18nProvider>);
}

describe('VoiceInput', () => {
  it('renders title and input field', () => {
    renderWithI18n(<VoiceInput />);
    expect(screen.getByText('Voice Input')).toBeTruthy();
    expect(screen.getByPlaceholderText(/type a message to translate/i)).toBeTruthy();
  });

  it('shows not supported alert when Web Speech API is missing', () => {
    const originalSpeech = window.SpeechRecognition;
    const originalWebkit = window.webkitSpeechRecognition;
    delete window.SpeechRecognition;
    delete window.webkitSpeechRecognition;

    try {
      renderWithI18n(<VoiceInput />);
      expect(screen.getByRole('alert')).toBeTruthy();
      expect(screen.getByText(/not supported in this browser/i)).toBeTruthy();
    } finally {
      window.SpeechRecognition = originalSpeech;
      window.webkitSpeechRecognition = originalWebkit;
    }
  });
});
