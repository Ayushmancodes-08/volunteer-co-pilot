'use client';
import React, { useMemo } from 'react';
import { useI18n } from '../context/I18nContext';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  volunteerName?: string;
}

export default function Header({ activeTab, setActiveTab, volunteerName }: HeaderProps) {
  const { t, lang, setLang } = useI18n();
  const tabs = useMemo(() => [
    { id: 'briefing', label: t('nav.briefing'), icon: '📋' },
    { id: 'dashboard', label: t('nav.dashboard'), icon: '📊' },
    { id: 'alerts', label: t('nav.alerts'), icon: '🚨' },
    { id: 'translate', label: t('nav.translate'), icon: '🗣️' },
    { id: 'history', label: t('nav.history'), icon: '📜' },
    { id: 'profile', label: t('nav.profile'), icon: '👤' },
  ], [t]);

  return (
    <>
      {/* Desktop Header */}
      <header className="bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 text-white shadow-lg sticky top-0 z-50 border-b border-blue-500/20" role="banner">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between flex-wrap gap-3">
          
          {/* Logo & Subtitle */}
          <div className="flex items-center gap-3">
            <span className="text-2xl" aria-hidden="true">🏆</span>
            <div>
              <h1 className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-amber-400 to-yellow-200 bg-clip-text text-transparent">
                {t('app.title')}
              </h1>
              <p className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
                {t('app.subtitle')}
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex gap-1 flex-wrap" role="navigation" aria-label="Main navigation">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                  activeTab === tab.id
                    ? 'bg-blue-600/90 text-white shadow-sm border border-blue-400/30'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
                aria-current={activeTab === tab.id ? 'page' : undefined}
              >
                <span aria-hidden="true">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>

          {/* User info and language toggle */}
          <div className="flex items-center gap-3">
            {/* Volunteer Profile Quickbadge */}
            {volunteerName && (
              <div className="hidden sm:flex items-center gap-2 bg-slate-800/80 border border-slate-700/50 px-3 py-1.5 rounded-full text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true"></span>
                <span className="font-semibold text-slate-200">{volunteerName}</span>
              </div>
            )}

            {/* Language Switcher */}
            <div className="flex items-center gap-1">
              <button
                id="lang-toggle"
                onClick={() => setLang(lang === 'en' ? 'es' : 'en')}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold border border-slate-700/60 uppercase tracking-wider transition-all"
                aria-label={`Switch language to ${lang === 'en' ? 'Spanish' : 'English'}`}
              >
                {lang === 'en' ? 'ES' : 'EN'}
              </button>
            </div>
          </div>

        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 z-50 flex justify-around py-2 px-1 shadow-2xl"
        role="navigation"
        aria-label="Mobile navigation"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            aria-label={tab.label}
            aria-current={activeTab === tab.id ? 'page' : undefined}
            className={`flex flex-col items-center gap-1 flex-1 py-1 rounded-xl transition-all ${
              activeTab === tab.id 
                ? 'text-blue-400 font-bold bg-slate-800/30' 
                : 'text-slate-400 font-medium'
            }`}
          >
            <span className="text-lg" aria-hidden="true">{tab.icon}</span>
            <span className="text-[9px] uppercase tracking-wider scale-90 sr-only">{tab.label}</span>
            <span className="text-[9px] uppercase tracking-wider scale-90" aria-hidden="true">{tab.label.split(' ')[0]}</span>
          </button>
        ))}
      </nav>
    </>
  );
}
