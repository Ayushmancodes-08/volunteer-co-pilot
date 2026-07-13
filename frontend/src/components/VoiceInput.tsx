'use client';
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useI18n } from '../context/I18nContext';
import { useTranslation } from '../hooks/useTranslation';
import { LANGUAGES } from '../utils/languages';
import { getSpeechRecognition, ISpeechRecognition } from '../utils/speechRecognition';

export default function VoiceInput() {
  const { t } = useI18n();
  const { result, loading, error, translate } = useTranslation();
  const [listening, setListening] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [supported, setSupported] = useState<boolean>(true);
  const [targetLang, setTargetLang] = useState<string>('spanish');
  const [manualText, setManualText] = useState<string>('');
  const recognitionRef = useRef<ISpeechRecognition | null>(null);

  useEffect(() => {
    const SpeechRecognition = getSpeechRecognition();
    if (!SpeechRecognition) {
      setSupported(false);
    }
  }, []);

  const startListening = useCallback(() => {
    const SpeechRecognition = getSpeechRecognition();
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      const spoken = event.results[0][0].transcript;
      setTranscript(spoken);
      void translate(spoken, targetLang, 'general_info', false);
      setListening(false);
      recognitionRef.current = null;
    };

    recognition.onerror = () => {
      setListening(false);
      recognitionRef.current = null;
    };

    recognition.onend = () => {
      setListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }, [targetLang, translate]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setListening(false);
  }, []);

  const handleManualTranslate = () => {
    if (!manualText.trim()) return;
    void translate(manualText.trim(), targetLang, 'general_info', false);
  };

  if (!supported) {
    return (
      <section aria-label={t('voice.title')} className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="font-semibold mb-2">{t('voice.title')}</h3>
        <p className="text-sm text-yellow-800" role="alert">{t('voice.notSupported')}</p>
        <div className="mt-3 mb-3">
          <label htmlFor="voice-fallback-lang" className="block text-sm font-medium text-slate-700 mb-1">
            {t('translate.language')}
          </label>
          <select
            id="voice-fallback-lang"
            value={targetLang}
            onChange={(e) => setTargetLang(e.target.value)}
            className="border border-slate-300 rounded px-3 py-2 text-sm"
          >
            {LANGUAGES.map((l) => (
              <option key={l.value} value={l.value}>{l.label}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={manualText}
            onChange={(e) => setManualText(e.target.value)}
            placeholder={t('translate.placeholder')}
            className="flex-1 border border-slate-300 rounded px-3 py-2 text-sm"
            aria-label={t('translate.text')}
          />
          <button
            onClick={handleManualTranslate}
            disabled={loading || !manualText.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {t('translate.generate')}
          </button>
        </div>
        {result && (
          <div className="mt-3 p-3 bg-white rounded border border-slate-200">
            <p className="text-sm font-medium">{t('translate.result')}:</p>
            <p>{result.translatedText}</p>
            {result.phonetic && (
              <p className="text-sm text-slate-500 mt-1">[{result.phonetic}]</p>
            )}
          </div>
        )}
      </section>
    );
  }

  return (
    <section aria-label={t('voice.title')} className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
      <h3 className="font-semibold mb-3">{t('voice.title')}</h3>

      <div className="mb-3">
        <label htmlFor="voice-target-lang" className="block text-sm font-medium text-slate-700 mb-1">
          {t('translate.language')}
        </label>
        <select
          id="voice-target-lang"
          value={targetLang}
          onChange={(e) => setTargetLang(e.target.value)}
          className="border border-slate-300 rounded px-3 py-2 text-sm"
        >
          {LANGUAGES.map((l) => (
            <option key={l.value} value={l.value}>{l.label}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-3 mb-3">
        {listening ? (
          <button
            onClick={stopListening}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 flex items-center gap-2"
            aria-label={t('voice.stop')}
          >
            <span className="w-2 h-2 bg-white rounded-sm inline-block" aria-hidden="true" />
            {t('voice.stop')}
          </button>
        ) : (
          <button
            onClick={startListening}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            aria-label={t('voice.start')}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
            {t('voice.start')}
          </button>
        )}

        {listening && (
          <span className="text-sm text-red-600 flex items-center gap-1" role="status" aria-live="polite">
            <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse inline-block" aria-hidden="true" />
            {t('voice.listening')}
          </span>
        )}
      </div>

      {error && (
        <p className="text-red-600 text-sm mb-2" role="alert">{t('voice.error')}</p>
      )}

      {result && (
        <div className="space-y-2">
          {transcript && (
            <p className="text-sm text-slate-500">
              <span className="font-medium">{t('voice.youSaid')}</span> {transcript}
            </p>
          )}
          <div className="bg-white border border-slate-200 rounded p-3">
            <p className="text-sm font-medium text-slate-700">{t('translate.result')}:</p>
            <p className="text-lg">{result.translatedText}</p>
          </div>
          {result.phonetic && (
            <div className="bg-blue-50 border border-blue-200 rounded p-3">
              <p className="text-sm text-blue-700">{t('translate.phonetic')}: {result.phonetic}</p>
            </div>
          )}
        </div>
      )}

      <div className="mt-3 border-t border-slate-200 pt-3">
        <p className="text-xs text-slate-500 mb-2">{t('voice.orType')}</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={manualText}
            onChange={(e) => setManualText(e.target.value)}
            placeholder={t('translate.placeholder')}
            className="flex-1 border border-slate-300 rounded px-3 py-2 text-sm"
            aria-label={t('translate.text')}
          />
          <button
            onClick={handleManualTranslate}
            disabled={loading || !manualText.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {t('translate.generate')}
          </button>
        </div>
      </div>
    </section>
  );
}
