'use client';
import { useState } from 'react';
import { useI18n } from '../context/I18nContext.jsx';
import { useTranslation } from '../hooks/useTranslation.js';
import { LANGUAGES } from '../utils/languages.js';

const INTENTS = ['redirect', 'medical_urgency', 'general_info', 'greeting', 'emergency_evacuation'];

export default function MultilingualPanel() {
  const { t } = useI18n();
  const { result, loading, error, translate, clearResult } = useTranslation();
  const [text, setText] = useState('');
  const [language, setLanguage] = useState('spanish');
  const [intent, setIntent] = useState('general_info');
  const [urgent, setUrgent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    translate(text.trim(), language, intent, urgent);
  };

  return (
    <section aria-label={t('translate.title')}>
      <h2 className="text-xl font-semibold mb-4">{t('translate.title')}</h2>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
        <div>
          <label htmlFor="translate-text" className="block text-sm font-medium text-slate-700 mb-1">
            {t('translate.text')}
          </label>
          <textarea
            id="translate-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t('translate.placeholder')}
            rows={3}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            aria-describedby="translate-text-hint"
          />
          <p id="translate-text-hint" className="text-xs text-slate-400 mt-1">
            {t('translate.placeholder')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="translate-intent" className="block text-sm font-medium text-slate-700 mb-1">
              {t('translate.intent')}
            </label>
            <select
              id="translate-intent"
              value={intent}
              onChange={(e) => setIntent(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            >
              {INTENTS.map((i) => (
                <option key={i} value={i}>{t(`intent.${i}`)}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="translate-language" className="block text-sm font-medium text-slate-700 mb-1">
              {t('translate.language')}
            </label>
            <select
              id="translate-language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            >
              {LANGUAGES.map((l) => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>
          </div>
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={urgent}
            onChange={(e) => setUrgent(e.target.checked)}
            className="rounded border-slate-300"
            aria-label={t('translate.urgent')}
          />
          <span className="text-sm text-slate-700">{t('translate.urgent')}</span>
        </label>

        <button
          type="submit"
          disabled={loading || !text.trim()}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? t('translate.generating') : t('translate.generate')}
        </button>

        {error && (
          <p className="text-red-600 text-sm" role="alert">{error}</p>
        )}
      </form>

      {result && (
        <div className="mt-6 space-y-4 max-w-2xl">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-slate-700 mb-2">{t('translate.result')}</h3>
            <p className="text-lg" lang={language}>{result.translatedText}</p>
          </div>
          {result.phonetic && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-700 mb-2">{t('translate.phonetic')}</h3>
              <p className="text-base text-blue-900" aria-label={`Pronunciation: ${result.phonetic}`}>
                {result.phonetic}
              </p>
            </div>
          )}
          <button
            onClick={clearResult}
            className="text-sm text-slate-500 hover:text-slate-700 underline"
          >
            {t('translate.clear')}
          </button>
        </div>
      )}
    </section>
  );
}