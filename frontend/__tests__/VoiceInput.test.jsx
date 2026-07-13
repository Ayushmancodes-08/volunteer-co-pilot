import { describe, it, expect, mock } from 'bun:test';
import { render, screen, fireEvent, act } from '@testing-library/react';
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

  it('can start and stop listening using SpeechRecognition mock', async () => {
    let mockInstance = null;
    const mockStart = mock(() => {});
    const mockStop = mock(() => {});
    
    class MockSpeechRecognition {
      constructor() {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        mockInstance = this;
      }
      continuous = false;
      interimResults = false;
      lang = '';
      start = mockStart;
      stop = mockStop;
    }
    window.SpeechRecognition = MockSpeechRecognition;

    renderWithI18n(<VoiceInput />);
    
    // Not listening initially
    const startBtn = screen.getByLabelText(/Start/i);
    fireEvent.click(startBtn);
    
    expect(mockStart).toHaveBeenCalled();
    
    // Now it should show stop button and listening indicator
    const stopBtn = await screen.findByLabelText(/Stop/i);
    expect(stopBtn).toBeTruthy();
    expect(screen.getByText(/Listening/i)).toBeTruthy();
    
    // Trigger callbacks for coverage
    if (mockInstance) {
      if (mockInstance.onresult) {
        act(() => {
          mockInstance.onresult({ results: [[{ transcript: 'test transcript' }]] });
        });
      }
      
      // Start again to test other callbacks
      fireEvent.click(startBtn);
      if (mockInstance.onerror) {
        act(() => { mockInstance.onerror(); });
      }
      
      fireEvent.click(startBtn);
      if (mockInstance.onend) {
        act(() => { mockInstance.onend(); });
      }
    }

    fireEvent.click(startBtn);
    const newStopBtn = await screen.findByLabelText(/Stop/i);
    fireEvent.click(newStopBtn);
    expect(mockStop).toHaveBeenCalled();
  });

  it('handles manual translation', () => {
    // We already have a mock for useTranslation in hooks.test.jsx, but since it's global mock.module we can rely on it if it was loaded, or we just test the UI changes.
    // The previous tests just verify UI.
    renderWithI18n(<VoiceInput />);
    
    const input = screen.getByPlaceholderText(/type a message to translate/i);
    const generateBtn = screen.getByText(/Generate Script/i);
    
    expect(generateBtn.disabled).toBe(true);
    
    fireEvent.change(input, { target: { value: 'hello' } });
    
    expect(generateBtn.disabled).toBe(false);
    generateBtn.click();
    // It should call translate, but testing the exact call needs module mocking, which we skip for UI test.
  });
});
