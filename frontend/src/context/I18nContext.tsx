'use client';
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import en from '../i18n/en.json';
import es from '../i18n/es.json';

const translations: Record<'en' | 'es', Record<string, string>> = { en, es };

interface I18nContextType {
  lang: 'en' | 'es';
  t: (key: string) => string;
  setLang: (lang: 'en' | 'es') => void;
}

const I18nContext = createContext<I18nContextType>({
  lang: 'en',
  t: (key: string) => key,
  setLang: () => {},
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<'en' | 'es'>('en');
  const t = useCallback(
    (key: string) => {
      const dict = translations[lang];
      return dict[key] || key;
    },
    [lang]
  );

  return (
    <I18nContext.Provider value={{ lang, t, setLang }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextType {
  return useContext(I18nContext);
}
