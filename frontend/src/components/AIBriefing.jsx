'use client';
import { useEffect } from 'react';
import { useI18n } from '../context/I18nContext.jsx';

export default function AIBriefing({ briefing, loading, onFetch, volunteer }) {
  const { t } = useI18n();

  useEffect(() => {
    if (volunteer && !briefing && !loading) {
      onFetch(volunteer.name, volunteer.role, volunteer.gate);
    }
  }, [volunteer, briefing, loading, onFetch]);

  const handleRefresh = () => {
    if (volunteer) {
      onFetch(volunteer.name, volunteer.role, volunteer.gate);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header and trigger */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">{t('briefing.title')}</h2>
          <p className="text-sm text-slate-500">Real-time GenAI shift intelligence customized to your profile.</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="bg-slate-900 text-white hover:bg-slate-800 text-sm font-semibold px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H17" />
            </svg>
          )}
          {t('briefing.refresh')}
        </button>
      </div>

      {loading && (
        <div className="bg-white/60 border border-slate-200/50 rounded-2xl p-12 text-center shadow-sm flex flex-col items-center justify-center gap-4">
          <svg className="animate-spin h-8 w-8 text-blue-600" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-sm font-medium text-slate-500 animate-pulse">{t('briefing.loading')}</span>
        </div>
      )}

      {!loading && briefing && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Welcome & AI Summary Card */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-gradient-to-br from-blue-900 to-indigo-950 text-white rounded-2xl p-6 shadow-md border border-slate-800">
              <div className="flex items-center gap-2 mb-3">
                <span className="bg-blue-600/30 border border-blue-500/30 text-blue-300 text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
                  Shift Intelligence
                </span>
                <span className="text-slate-400 text-xs">Live Update</span>
              </div>
              <p className="text-lg font-medium leading-relaxed mb-4 text-slate-100">
                "{briefing.summary}"
              </p>
              <div className="flex items-center gap-2 text-sm text-slate-300 border-t border-white/10 pt-4">
                <span>Active Assignment:</span>
                <strong className="text-white bg-white/10 px-2 py-0.5 rounded">Gate {volunteer?.gate}</strong>
                <span>Role:</span>
                <strong className="text-white bg-white/10 px-2 py-0.5 rounded">{volunteer?.role}</strong>
              </div>
            </div>

            {/* Weather and Crowd outlook side by side */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Weather Widget */}
              <div className="bg-white/80 backdrop-blur-md border border-slate-200/60 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-amber-100 text-amber-700 p-2.5 rounded-xl text-xl">☀️</div>
                  <h3 className="font-bold text-slate-800">{t('briefing.weather')}</h3>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">{briefing.weatherForecast}</p>
              </div>

              {/* Crowd Outlook Widget */}
              <div className="bg-white/80 backdrop-blur-md border border-slate-200/60 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-indigo-100 text-indigo-700 p-2.5 rounded-xl text-xl">👥</div>
                  <h3 className="font-bold text-slate-800">{t('briefing.crowd')}</h3>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">{briefing.crowdOutlook}</p>
              </div>
            </div>

            {/* Suggested actions list */}
            <div className="bg-white/80 backdrop-blur-md border border-slate-200/60 rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                {t('briefing.actions')}
              </h3>
              <ul className="space-y-3">
                {briefing.suggestedActions?.map((action, i) => (
                  <li key={i} className="flex gap-3 items-start bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                    <span className="w-5 h-5 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full flex items-center justify-center shrink-0 mt-0.5">{i+1}</span>
                    <span className="text-sm font-medium text-slate-700">{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Announcements Card */}
          <div className="lg:col-span-1 bg-white/80 backdrop-blur-md border border-slate-200/60 rounded-2xl p-6 shadow-sm h-fit">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {t('briefing.announcements')}
            </h3>
            <ul className="space-y-4">
              {briefing.announcements?.map((anno, i) => (
                <li key={i} className="border-b border-slate-100 last:border-0 pb-3 last:pb-0">
                  <span className="text-xs font-bold text-indigo-600 block mb-1">ALERT</span>
                  <span className="text-sm text-slate-600 leading-relaxed font-medium block">{anno}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
