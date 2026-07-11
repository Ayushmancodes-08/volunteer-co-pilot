'use client';
import { createContext, useContext, useState, useCallback } from 'react';
import en from '../i18n/en.json';
import es from '../i18n/es.json';

/** @type {{ en: typeof en, es: typeof es }} */
const translations = { en, es };

const I18nContext = createContext({
  lang: 'en',
  /** @param {string} key @returns {string} */
  t: (key) => key,
  /** @param {'en' | 'es'} _lang */
  setLang: (_lang) => {},
});

/**
 * Provides i18n context to the component tree.
 *
 * @param {{ children: React.ReactNode }} props
 */
export function I18nProvider({ children }) {
  const [lang, setLang] = useState('en');
  const t = useCallback((key) => translations[lang][key] || key, [lang]);
  return (
    <I18nContext.Provider value={{ lang, t, setLang }}>
      {children}
    </I18nContext.Provider>
  );
}

/**
 * Returns the current i18n context value.
 *
 * @returns {{ lang: 'en' | 'es', t: (key: string) => string, setLang: (lang: 'en' | 'es') => void }}
 */
export function useI18n() {
  return useContext(I18nContext);
}